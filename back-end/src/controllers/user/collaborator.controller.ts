import { Response } from "express";
import { AuthRequest } from "../../dtos/auth";
import { parseId } from "../../utils/parseId";
import { 
  CollaboratorService, 
  VALID_AVAILABILITY_STATUSES, 
  VALID_JOB_STATUSES, 
  normalizeAvailabilityStatus,
  MAX_CONTACT_MESSAGE_LENGTH
} from "../../services/collaborator.service";

const getStringParam = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
};

export const getCollaboratorProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const result = await CollaboratorService.getProfile(userId);
    if (!result) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(result);
  } catch (error) {
    console.error("[getCollaboratorProfile] Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateCollaboratorAvailability = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const availabilityStatus = normalizeAvailabilityStatus(req.body?.availabilityStatus);
    if (availabilityStatus === null) {
      res.status(400).json({
        error: `availabilityStatus must be one of: ${VALID_AVAILABILITY_STATUSES.join(", ")}`,
      });
      return;
    }

    const availabilityNoteInput = req.body?.availabilityNote;
    if (availabilityNoteInput !== undefined && availabilityNoteInput !== null && typeof availabilityNoteInput !== "string") {
      res.status(400).json({ error: "availabilityNote must be a string when provided" });
      return;
    }

    const availabilityNote = typeof availabilityNoteInput === "string" ? availabilityNoteInput.trim() : undefined;

    if (availabilityNote && availabilityNote.length > 500) {
      res.status(400).json({ error: "availabilityNote must not exceed 500 characters" });
      return;
    }

    if (availabilityStatus === undefined && availabilityNote === undefined) {
      res.status(400).json({ error: "At least one field is required: availabilityStatus, availabilityNote" });
      return;
    }

    const updatedProfile = await CollaboratorService.updateAvailability(userId, availabilityStatus, availabilityNote);
    if (!updatedProfile) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      message: "Availability updated successfully",
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("[updateCollaboratorAvailability] Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAvailableJobs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Chưa xác thực người dùng." });
      return;
    }

    const keyword = typeof req.query.keyword === "string" ? req.query.keyword.trim() : "";
    const category = typeof req.query.category === "string" ? req.query.category.trim() : "";
    const location = typeof req.query.location === "string" ? req.query.location.trim() : "";
    const { page, limit } = req.query;

    const result = await CollaboratorService.getAvailableJobs(userId, { keyword, category, location, page, limit });
    res.json(result);
  } catch (error) {
    console.error("[getAvailableJobs] Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getJobDetail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const jobId = parseId(getStringParam(req.params.id));
    const userId = req.user?.id;

    if (!jobId || !userId) {
      res.status(400).json({ error: "Invalid job id" });
      return;
    }

    const jobDetail = await CollaboratorService.getJobDetail(userId, jobId);
    if (!jobDetail) {
      res.status(404).json({ error: "Job not found" });
      return;
    }

    res.json(jobDetail);
  } catch (error: any) {
    if (error.message === "ACCESS_DENIED") {
      res.status(403).json({ error: "Access denied to this job detail" });
      return;
    }
    console.error("[getJobDetail] Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const decideJob = async (req: AuthRequest, res: Response): Promise<void> => {
  const decision = typeof req.body?.decision === "string" ? req.body.decision.trim().toLowerCase() : "";
  try {
    const jobId = parseId(getStringParam(req.params.id));
    const userId = req.user?.id;
    const reason = typeof req.body?.reason === "string" ? req.body.reason.trim() : null;

    if (!jobId || !userId) {
      res.status(400).json({ error: "Invalid job id" });
      return;
    }

    if (!["accept", "decline"].includes(decision)) {
      res.status(400).json({ error: "decision must be accept or decline" });
      return;
    }

    if (decision === "accept") {
      const updatedJob = await CollaboratorService.acceptJob(userId, jobId);
      res.json({ message: "Job accepted successfully", job: updatedJob });
      return;
    } 
    
    if (decision === "decline") {
      const updatedJob = await CollaboratorService.declineJob(userId, jobId, reason);
      res.json({ message: "Đã ghi nhận từ chối. Công việc vẫn mở để khách hàng tìm cộng tác viên khác.", job: updatedJob });
      return;
    }
  } catch (error: any) {
    if (error.message === "NOT_FOUND") {
      res.status(404).json({ error: "Job not found" });
      return;
    }
    if (error.message === "CONFLICT") {
      res.status(409).json({ error: decision === "accept" ? "Job is no longer open for acceptance" : "Job is no longer open for decision", job: error.job });
      return;
    }
    if (error.message === "ALREADY_DECLINED") {
      res.status(409).json({ error: "Bạn đã từ chối công việc này trước đó." });
      return;
    }
    console.error("[decideJob] Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const contactJobCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const jobId = parseId(getStringParam(req.params.id));
    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";

    if (!userId || !jobId) {
      res.status(400).json({ error: "Invalid job id" });
      return;
    }

    if (!message) {
      res.status(400).json({ error: "message is required" });
      return;
    }

    if (message.length > MAX_CONTACT_MESSAGE_LENGTH) {
      res.status(400).json({ error: `message must not exceed ${MAX_CONTACT_MESSAGE_LENGTH} characters` });
      return;
    }

    const result = await CollaboratorService.contactCustomer(userId, jobId, message);
    res.status(201).json({
      message: "Contact request sent successfully (via ticket replies)",
      ...result
    });
  } catch (error: any) {
    if (error.message === "NOT_FOUND") {
      res.status(404).json({ error: "Job not found" });
      return;
    }
    if (error.message === "ACCESS_DENIED") {
      res.status(403).json({ error: "Access denied to contact this customer" });
      return;
    }
    if (error.message === "NO_CUSTOMER") {
      res.status(409).json({ error: "Job does not have a valid customer" });
      return;
    }
    console.error("[contactJobCustomer] Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMyJobs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const statusFilter = typeof req.query.status === "string" ? req.query.status.trim() : "";
    if (statusFilter && !VALID_JOB_STATUSES.includes(statusFilter.toLowerCase() as any)) {
      res.status(400).json({ error: `status must be one of: ${VALID_JOB_STATUSES.join(", ")}` });
      return;
    }

    const { page, limit } = req.query;
    const result = await CollaboratorService.getMyJobs(userId, statusFilter, { page, limit });
    res.json(result);
  } catch (error) {
    console.error("[getMyJobs] Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const submitJobDeliverables = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const jobId = parseId(getStringParam(req.params.id));

    if (!userId || !jobId) {
      res.status(400).json({ error: "Invalid job id" });
      return;
    }

    const fileUrls = Array.isArray(req.body?.fileUrls)
      ? req.body.fileUrls.filter((item: unknown): item is string => typeof item === "string" && item.trim().length > 0)
      : [];
    const note = typeof req.body?.note === "string" ? req.body.note.trim() : null;

    if (fileUrls.length === 0) {
      res.status(400).json({ error: "fileUrls must contain at least one URL" });
      return;
    }

    const submission = await CollaboratorService.submitDeliverables(userId, jobId, fileUrls, note);
    res.status(201).json({
      message: "Deliverables submitted and job marked as completed successfully",
      submission: {
        deliverableId: submission.replyId,
        ...submission
      },
    });
  } catch (error: any) {
    if (error.message === "NOT_FOUND") {
      res.status(404).json({ error: "Active job not found for this collaborator" });
      return;
    }
    if (error.message === "INVALID_STATUS") {
      res.status(400).json({ error: "Only accepted jobs can have deliverables submitted" });
      return;
    }
    console.error("[submitJobDeliverables] Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getCollaboratorEarnings = async (_req: AuthRequest, res: Response): Promise<void> => {
  res.status(410).json({ error: "GreenMarket không còn theo dõi thu nhập cộng tác viên trong hệ thống. Khách hàng và cộng tác viên tự liên hệ, thỏa thuận và thanh toán trực tiếp." });
};

export const getPayoutRequestHistory = async (_req: AuthRequest, res: Response): Promise<void> => {
  res.status(410).json({ error: "GreenMarket không còn hỗ trợ lịch sử yêu cầu chi trả cho cộng tác viên. Việc thanh toán được thực hiện trực tiếp ngoài hệ thống." });
};

export const createPayoutRequest = async (_req: AuthRequest, res: Response): Promise<void> => {
  res.status(410).json({ error: "GreenMarket không còn hỗ trợ tạo yêu cầu chi trả cho cộng tác viên. Khách hàng và cộng tác viên tự liên hệ để thanh toán trực tiếp ngoài hệ thống." });
};

export const getPublicCollaborators = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { page, limit, keyword, location, status } = req.query;
    const result = await CollaboratorService.getPublicCollaborators(userId, { 
      page, 
      limit,
      keyword: getStringParam(keyword),
      location: getStringParam(location),
      status: getStringParam(status)
    });
    res.json(result);
  } catch (error) {
    console.error("[getPublicCollaborators] Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getPublicCollaboratorDetail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const requesterId = req.user?.id;
    const targetUserId = parseId(req.params.id as string);

    if (!requesterId || !targetUserId) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }

    const detail = await CollaboratorService.getPublicCollaboratorDetail(requesterId, targetUserId);
    if (!detail) {
      res.status(404).json({ error: "Collaborator not found" });
      return;
    }

    res.json(detail);
  } catch (error) {
    console.error("[getPublicCollaboratorDetail] Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMyInvitations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const invitations = await CollaboratorService.getMyInvitations(userId);
    res.json(invitations);
  } catch (error) {
    console.error("[getMyInvitations] Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const respondToInvitation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const invitationId = parseId(req.params.id as string);

    if (!req.body) {
      res.status(400).json({ error: "Request body is missing. Ensure you are sending JSON with Content-Type: application/json" });
      return;
    }

    const { action } = req.body;

    if (!userId || !invitationId) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }

    if (!["accept", "reject"].includes(action)) {
      res.status(400).json({ error: "Action must be 'accept' or 'reject'" });
      return;
    }

    const status = await CollaboratorService.respondToInvitation(userId, invitationId, action);
    res.json({ message: `Invitation ${action}ed successfully`, status });
  } catch (error: any) {
    if (error.message === "NOT_FOUND") {
      res.status(404).json({ error: "Invitation not found or no longer pending" });
      return;
    }
    console.error("[respondToInvitation] Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMyActiveShops = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const rows = await CollaboratorService.getMyActiveShops(userId);
    res.json({ data: rows });
  } catch (error) {
    console.error("[getMyActiveShops] Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

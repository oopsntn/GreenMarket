import { api } from '../../config/api';

export type OperationTaskStatus = 'open' | 'in_progress' | 'closed';
export type OperationTaskType = 'report' | 'verification' | 'support';
export type OperationTaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type ReplyVisibility = 'internal' | 'public';
export type EscalationTargetRole = 'MANAGER' | 'ADMIN';

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface OperationTaskListItem {
  taskId: number;
  title: string;
  type: OperationTaskType | string;
  status: OperationTaskStatus | string;
  priority: OperationTaskPriority | string;
  customerName: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface OperationTask {
  taskId: number;
  taskTitle: string;
  taskType: OperationTaskType | string;
  taskStatus: OperationTaskStatus | string;
  taskPriority: OperationTaskPriority | string;
  assigneeId: number | null;
  customerId: number | null;
  relatedTargetId: number | null;
  taskNote: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface OperationTaskReply {
  replyId: number;
  message: string;
  attachments: string[];
  visibility: ReplyVisibility | string;
  createdAt: string | null;
  senderName: string | null;
}

export interface OperationEscalation {
  escalationId: number;
  sourceTaskId: number | null;
  targetType: string;
  targetId: number;
  createdBy: number;
  severity: string;
  reason: string;
  evidenceUrls: string[];
  status: string;
  resolutionNote: string | null;
  createdAt: string | null;
  resolvedAt: string | null;
}

export interface OperationTaskDetailResponse {
  task: OperationTask;
  replies: OperationTaskReply[];
  escalations: OperationEscalation[];
}

export interface OperationWorkloadStats {
  total: number;
  closed: number;
  open: number;
  inProgress: number;
}

export interface OperationNotification {
  notificationId: number;
  recipientId: number;
  title: string;
  message: string;
  type: string;
  metaData: Record<string, unknown>;
  isRead: boolean;
  createdAt: string | null;
}

export interface GetTasksParams {
  status?: OperationTaskStatus;
  type?: OperationTaskType;
  priority?: OperationTaskPriority;
  page?: number;
  limit?: number;
}

export interface CreateReplyPayload {
  message: string;
  attachments?: string[];
  visibility?: ReplyVisibility;
}

export interface EscalateTaskPayload {
  reason: string;
  targetRole: EscalationTargetRole;
  priority?: OperationTaskPriority;
}

const normalizeStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }

  return [];
};

const normalizeMeta = (meta: unknown): PaginationMeta => {
  const source = (meta ?? {}) as Record<string, unknown>;

  return {
    page: Number(source.page || 1),
    limit: Number(source.limit || 20),
    totalItems: Number(source.totalItems || 0),
    totalPages: Number(source.totalPages || 1),
  };
};

const normalizeTaskListItem = (item: unknown): OperationTaskListItem => {
  const source = item as Record<string, unknown>;

  return {
    taskId: Number(source.taskId || 0),
    title: typeof source.title === 'string' ? source.title : '',
    type: typeof source.type === 'string' ? source.type : 'support',
    status: typeof source.status === 'string' ? source.status : 'open',
    priority: typeof source.priority === 'string' ? source.priority : 'medium',
    customerName: typeof source.customerName === 'string' ? source.customerName : null,
    createdAt: typeof source.createdAt === 'string' ? source.createdAt : null,
    updatedAt: typeof source.updatedAt === 'string' ? source.updatedAt : null,
  };
};

const normalizeReply = (item: unknown): OperationTaskReply => {
  const source = item as Record<string, unknown>;

  return {
    replyId: Number(source.replyId || 0),
    message: typeof source.message === 'string' ? source.message : '',
    attachments: normalizeStringArray(source.attachments),
    visibility: typeof source.visibility === 'string' ? source.visibility : 'internal',
    createdAt: typeof source.createdAt === 'string' ? source.createdAt : null,
    senderName: typeof source.senderName === 'string' ? source.senderName : null,
  };
};

const normalizeEscalation = (item: unknown): OperationEscalation => {
  const source = item as Record<string, unknown>;

  return {
    escalationId: Number(source.escalationId || 0),
    sourceTaskId: source.sourceTaskId ? Number(source.sourceTaskId) : null,
    targetType: typeof source.targetType === 'string' ? source.targetType : 'MANAGER',
    targetId: Number(source.targetId || 0),
    createdBy: Number(source.createdBy || 0),
    severity: typeof source.severity === 'string' ? source.severity : 'medium',
    reason: typeof source.reason === 'string' ? source.reason : '',
    evidenceUrls: normalizeStringArray(source.evidenceUrls),
    status: typeof source.status === 'string' ? source.status : 'open',
    resolutionNote: typeof source.resolutionNote === 'string' ? source.resolutionNote : null,
    createdAt: typeof source.createdAt === 'string' ? source.createdAt : null,
    resolvedAt: typeof source.resolvedAt === 'string' ? source.resolvedAt : null,
  };
};

export const operationsService = {
  getTasks: async (params: GetTasksParams = {}) => {
    const response = await api.get('/operations/tasks', { params });
    const rows = Array.isArray(response.data?.data) ? response.data.data : [];

    return {
      data: rows.map(normalizeTaskListItem),
      meta: normalizeMeta(response.data?.meta),
    };
  },

  getTaskDetail: async (taskId: number): Promise<OperationTaskDetailResponse> => {
    const response = await api.get(`/operations/tasks/${taskId}`);
    const task = response.data?.task as OperationTask;

    return {
      task,
      replies: Array.isArray(response.data?.replies)
        ? response.data.replies.map(normalizeReply)
        : [],
      escalations: Array.isArray(response.data?.escalations)
        ? response.data.escalations.map(normalizeEscalation)
        : [],
    };
  },

  updateTaskStatus: async (taskId: number, status: OperationTaskStatus, note?: string) => {
    const response = await api.patch(`/operations/tasks/${taskId}/status`, {
      status,
      note,
    });

    return response.data;
  },

  createTaskReply: async (taskId: number, payload: CreateReplyPayload) => {
    const response = await api.post(`/operations/tasks/${taskId}/replies`, payload);
    return response.data;
  },

  escalateTask: async (taskId: number, payload: EscalateTaskPayload) => {
    const response = await api.post(`/operations/tasks/${taskId}/escalate`, payload);
    return response.data;
  },

  getDailyWorkload: async (): Promise<{ stats: OperationWorkloadStats }> => {
    const response = await api.get('/operations/workload/daily');

    return {
      stats: {
        total: Number(response.data?.stats?.total || 0),
        closed: Number(response.data?.stats?.closed || 0),
        open: Number(response.data?.stats?.open || 0),
        inProgress: Number(response.data?.stats?.inProgress || 0),
      },
    };
  },

  getNotifications: async () => {
    const response = await api.get('/operations/notifications');
    const rows = Array.isArray(response.data?.data) ? response.data.data : [];

    return {
      data: rows as OperationNotification[],
    };
  },
};

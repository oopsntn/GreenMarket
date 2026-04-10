import { useEffect, useMemo, useState } from "react";
import BaseModal from "../components/BaseModal";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import SearchToolbar from "../components/SearchToolbar";
import SectionCard from "../components/SectionCard";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import ToastContainer, { type ToastItem } from "../components/ToastContainer";
import { postModerationService } from "../services/postModerationService";
import type {
  PostModerationItem,
  PostModerationStatus,
} from "../types/postModeration";
import "./PostsModerationPage.css";

const PAGE_SIZE = 5;

type StatusFilter = PostModerationStatus | "All";

type ModerationAction = "approve" | "reject" | "hide";

type ModerationState = {
  isOpen: boolean;
  action: ModerationAction | null;
  post: PostModerationItem | null;
};

const statusFilterOptions: StatusFilter[] = [
  "All",
  "Pending",
  "Approved",
  "Rejected",
  "Hidden",
  "Draft",
];

function PostsModerationPage() {
  const [posts, setPosts] = useState<PostModerationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] =
    useState<StatusFilter>("All");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedPost, setSelectedPost] = useState<PostModerationItem | null>(
    null,
  );
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [moderationState, setModerationState] = useState<ModerationState>({
    isOpen: false,
    action: null,
    post: null,
  });
  const [moderationReason, setModerationReason] = useState("");
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = (message: string, tone: ToastItem["tone"] = "success") => {
    const toastId = Date.now() + Math.random();

    setToasts((prev) => [...prev, { id: toastId, message, tone }]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== toastId));
    }, 2600);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const loadPosts = async (showSuccessToast = false) => {
    try {
      setIsLoading(true);
      setError("");

      const nextPosts = await postModerationService.fetchPosts();
      setPosts(nextPosts);

      if (showSuccessToast) {
        showToast("Post moderation queue refreshed.");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to load moderation posts.";
      setError(message);
      showToast(message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPosts();
  }, []);

  const filteredPosts = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return posts.filter((post) => {
      const matchesKeyword =
        !keyword ||
        post.title.toLowerCase().includes(keyword) ||
        post.authorLabel.toLowerCase().includes(keyword) ||
        post.shopLabel.toLowerCase().includes(keyword) ||
        post.categoryLabel.toLowerCase().includes(keyword) ||
        post.location.toLowerCase().includes(keyword);

      const matchesStatus =
        selectedStatusFilter === "All" || post.status === selectedStatusFilter;

      return matchesKeyword && matchesStatus;
    });
  }, [posts, searchKeyword, selectedStatusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / PAGE_SIZE));

  const paginatedPosts = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return filteredPosts.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredPosts, page]);

  useEffect(() => {
    setPage(1);
  }, [searchKeyword, selectedStatusFilter]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pendingCount = posts.filter((post) => post.status === "Pending").length;
  const rejectedCount = posts.filter((post) => post.status === "Rejected").length;
  const hiddenCount = posts.filter((post) => post.status === "Hidden").length;

  const openDetailModal = async (post: PostModerationItem) => {
    setSelectedPost(post);
    setIsDetailLoading(true);

    try {
      const detail = await postModerationService.fetchPostById(post.id);
      setSelectedPost(detail);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Unable to load post details.",
        "error",
      );
    } finally {
      setIsDetailLoading(false);
    }
  };

  const closeDetailModal = () => {
    setSelectedPost(null);
  };

  const openModerationModal = (
    post: PostModerationItem,
    action: ModerationAction,
  ) => {
    setModerationState({
      isOpen: true,
      action,
      post,
    });
    setModerationReason("");
  };

  const closeModerationModal = () => {
    setModerationState({
      isOpen: false,
      action: null,
      post: null,
    });
    setModerationReason("");
  };

  const handleModerationSubmit = async () => {
    if (!moderationState.post || !moderationState.action) return;

    try {
      setIsSubmittingAction(true);

      const updatedPost =
        moderationState.action === "approve"
          ? await postModerationService.updatePostStatus(
              moderationState.post.id,
              "Approved",
            )
          : moderationState.action === "reject"
            ? await postModerationService.updatePostStatus(
                moderationState.post.id,
                "Rejected",
                moderationReason,
              )
            : await postModerationService.hidePost(
                moderationState.post.id,
                moderationReason,
              );

      setPosts((prev) =>
        prev.map((post) => (post.id === updatedPost.id ? updatedPost : post)),
      );
      setSelectedPost((prev) =>
        prev && prev.id === updatedPost.id ? updatedPost : prev,
      );

      showToast(
        `Post "${updatedPost.title}" was ${
          moderationState.action === "approve"
            ? "approved"
            : moderationState.action === "reject"
              ? "rejected"
              : "hidden"
        } successfully.`,
      );

      closeModerationModal();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Unable to update moderation.",
        "error",
      );
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const moderationTitle =
    moderationState.action === "approve"
      ? "Approve Post"
      : moderationState.action === "reject"
        ? "Reject Post"
        : "Hide Post";

  const moderationDescription =
    moderationState.action === "approve"
      ? "Approve this post so it can move forward in the marketplace workflow."
      : moderationState.action === "reject"
        ? "Reject this post and optionally provide a moderation reason."
        : "Hide this post from the marketplace and optionally record why.";

  return (
    <div className="posts-moderation-page">
      <PageHeader
        title="Posts Moderation"
        description="Review marketplace posts, inspect moderation details, and take approval actions."
        actionLabel="Refresh Queue"
        onActionClick={() => void loadPosts(true)}
      />

      <div className="posts-moderation-summary-grid">
        <StatCard
          title="Total Posts"
          value={String(posts.length)}
          subtitle="Posts currently available in admin moderation"
        />
        <StatCard
          title="Pending Review"
          value={String(pendingCount)}
          subtitle="Posts still waiting for action"
        />
        <StatCard
          title="Rejected Posts"
          value={String(rejectedCount)}
          subtitle="Posts rejected by moderation"
        />
        <StatCard
          title="Hidden Posts"
          value={String(hiddenCount)}
          subtitle="Posts manually hidden by admin"
        />
      </div>

      <SearchToolbar
        placeholder="Search by title, author, shop, category, or location"
        searchValue={searchKeyword}
        onSearchChange={setSearchKeyword}
        onFilterClick={() => setShowFilters((prev) => !prev)}
        filterLabel="Filter by status"
        filterSummaryItems={[selectedStatusFilter]}
      />

      {showFilters ? (
        <SectionCard
          title="Moderation Filters"
          description="Refine the queue by moderation status."
        >
          <div className="posts-moderation-filters">
            <div className="posts-moderation-filters__field">
              <label htmlFor="post-status-filter">Status</label>
              <select
                id="post-status-filter"
                value={selectedStatusFilter}
                onChange={(event) =>
                  setSelectedStatusFilter(event.target.value as StatusFilter)
                }
              >
                {statusFilterOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </SectionCard>
      ) : null}

      <SectionCard
        title="Moderation Queue"
        description="Inspect post metadata, current status, and moderation actions."
      >
        {isLoading ? (
          <EmptyState
            title="Loading moderation queue"
            description="Fetching posts from the admin moderation API."
          />
        ) : error ? (
          <EmptyState title="Unable to load posts" description={error} />
        ) : filteredPosts.length === 0 ? (
          <EmptyState
            title="No posts found"
            description="No posts match the current search or moderation filter."
          />
        ) : (
          <>
            <div className="posts-moderation-table-wrapper">
              <table className="posts-moderation-table">
                <thead>
                  <tr>
                    <th>Post</th>
                    <th>Owner</th>
                    <th>Status</th>
                    <th>Engagement</th>
                    <th>Submitted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPosts.map((post) => (
                    <tr key={post.id}>
                      <td>
                        <div className="posts-moderation-cell">
                          <strong>{post.title}</strong>
                          <span>{post.categoryLabel}</span>
                          <small>{post.location}</small>
                        </div>
                      </td>
                      <td>
                        <div className="posts-moderation-cell">
                          <strong>{post.authorLabel}</strong>
                          <span>{post.shopLabel}</span>
                          <small>{post.contactPhone}</small>
                        </div>
                      </td>
                      <td>
                        <div className="posts-moderation-status">
                          <StatusBadge
                            label={post.status}
                            variant={
                              post.status === "Approved"
                                ? "active"
                                : post.status === "Rejected"
                                  ? "locked"
                                  : post.status === "Hidden"
                                    ? "type"
                                    : "processing"
                            }
                          />
                          <small>{post.publishedLabel}</small>
                        </div>
                      </td>
                      <td>
                        <div className="posts-moderation-metrics">
                          <strong>{post.views} views</strong>
                          <span>{post.contacts} contacts</span>
                        </div>
                      </td>
                      <td>
                        <div className="posts-moderation-cell">
                          <strong>{post.submittedAt}</strong>
                          <small>{post.moderatedAt}</small>
                        </div>
                      </td>
                      <td>
                        <div className="posts-moderation-actions">
                          <button
                            type="button"
                            className="posts-moderation-actions__view"
                            onClick={() => void openDetailModal(post)}
                          >
                            View
                          </button>

                          {post.status !== "Approved" ? (
                            <button
                              type="button"
                              className="posts-moderation-actions__approve"
                              onClick={() => openModerationModal(post, "approve")}
                            >
                              Approve
                            </button>
                          ) : null}

                          {post.status !== "Rejected" ? (
                            <button
                              type="button"
                              className="posts-moderation-actions__reject"
                              onClick={() => openModerationModal(post, "reject")}
                            >
                              Reject
                            </button>
                          ) : null}

                          {post.status !== "Hidden" ? (
                            <button
                              type="button"
                              className="posts-moderation-actions__hide"
                              onClick={() => openModerationModal(post, "hide")}
                            >
                              Hide
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="posts-moderation-pagination">
              <span className="posts-moderation-pagination__info">
                Trang {page} / {totalPages}
              </span>

              <div className="posts-moderation-pagination__actions">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page === 1}
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={page === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </SectionCard>

      <BaseModal
        isOpen={selectedPost !== null}
        title={selectedPost?.title || "Post Details"}
        description="Review moderation metadata, content, and supporting details."
        onClose={closeDetailModal}
        maxWidth="920px"
      >
        {isDetailLoading ? (
          <div className="posts-moderation-empty-state">
            Loading post details...
          </div>
        ) : selectedPost ? (
          <div className="posts-moderation-detail">
            <div className="posts-moderation-detail__grid">
              <div className="posts-moderation-detail__field">
                <label>Status</label>
                <input type="text" value={selectedPost.status} disabled />
              </div>
              <div className="posts-moderation-detail__field">
                <label>Slug</label>
                <input type="text" value={selectedPost.slug} disabled />
              </div>
              <div className="posts-moderation-detail__field">
                <label>Author</label>
                <input type="text" value={selectedPost.authorLabel} disabled />
              </div>
              <div className="posts-moderation-detail__field">
                <label>Shop</label>
                <input type="text" value={selectedPost.shopLabel} disabled />
              </div>
              <div className="posts-moderation-detail__field">
                <label>Category</label>
                <input type="text" value={selectedPost.categoryLabel} disabled />
              </div>
              <div className="posts-moderation-detail__field">
                <label>Price</label>
                <input type="text" value={selectedPost.priceLabel} disabled />
              </div>
            </div>



            <div className="posts-moderation-detail__section">
              <h4>Moderation Notes</h4>
              <p>{selectedPost.rejectedReason}</p>
            </div>

            <div className="posts-moderation-detail__section">
              <h4>Images</h4>
              {selectedPost.images.length === 0 ? (
                <p>No image metadata available.</p>
              ) : (
                <ul className="posts-moderation-detail__list">
                  {selectedPost.images.map((imageUrl) => (
                    <li key={imageUrl}>{imageUrl}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="posts-moderation-detail__section">
              <h4>Attribute Values</h4>
              {selectedPost.attributes.length === 0 ? (
                <p>No attribute values returned by API.</p>
              ) : (
                <ul className="posts-moderation-detail__list">
                  {selectedPost.attributes.map((attribute) => (
                    <li key={`${attribute.id}-${attribute.value}`}>
                      Attribute #{attribute.id}: {attribute.value}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}
      </BaseModal>

      <BaseModal
        isOpen={moderationState.isOpen}
        title={moderationTitle}
        description={moderationDescription}
        onClose={closeModerationModal}
        maxWidth="520px"
      >
        <div className="posts-moderation-form">
          <p className="posts-moderation-form__target">
            Target: <strong>{moderationState.post?.title || "Selected post"}</strong>
          </p>

          <label htmlFor="posts-moderation-reason">Reason / Note</label>
          <textarea
            id="posts-moderation-reason"
            value={moderationReason}
            onChange={(event) => setModerationReason(event.target.value)}
            placeholder="Ghi chú kiểm duyệt (không bắt buộc)"
            rows={4}
          />

          <div className="posts-moderation-form__actions">
            <button type="button" onClick={closeModerationModal}>
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleModerationSubmit()}
              disabled={isSubmittingAction}
            >
              {isSubmittingAction ? "Saving..." : "Confirm"}
            </button>
          </div>
        </div>
      </BaseModal>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default PostsModerationPage;

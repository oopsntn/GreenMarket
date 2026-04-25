import { api, API_BASE_URL } from '../../../config/api';
import { postService } from '../../post/service/postService';

export interface AppNotification {
    notificationId: number;
    title: string | null;
    message: string;
    type: string;
    metaData?: Record<string, any> | null;
    isRead: boolean;
    createdAt: string;
}

const toNotificationList = (raw: unknown): AppNotification[] => {
    if (!Array.isArray(raw)) return [];

    return raw
        .map((item: any) => ({
            notificationId: Number(item?.notificationId || 0),
            title: item?.title || null,
            message: String(item?.message || ''),
            type: String(item?.type || 'system'),
            metaData: item?.metaData && typeof item.metaData === 'object' ? item.metaData : {},
            isRead: Boolean(item?.isRead),
            createdAt: String(item?.createdAt || ''),
        }))
        .filter((item) => item.notificationId > 0);
}

const includesText = (value: string | null | undefined, keyword: string) => {
    return String(value || '').toLowerCase().includes(keyword.toLowerCase());
}

const resolvePostSlugFromMyPosts = async (postId: number) => {
    const posts = await postService.getMyPosts();
    const post = Array.isArray(posts)
        ? posts.find((item: any) => Number(item?.postId) === Number(postId))
        : null;

    return post?.postSlug || null;
}

const navigateSafe = (navigation: any, screen: string, params?: Record<string, any>) => {
    try {
        navigation.navigate(screen, params);
        return true;
    } catch (error) {
        console.error('[Notification Navigation] Failed to navigate:', {
            screen,
            params,
            error,
        });
        return false;
    }
}

export const notificationService = {
    getNotifications: async (): Promise<AppNotification[]> => {
        const response = await api.get('/notifications');
        return toNotificationList(response.data);
    },

    getUnreadCount: async (): Promise<number> => {
        const notifications = await notificationService.getNotifications();
        return notifications.filter((item) => !item.isRead).length;
    },

    markAsRead: async (notificationId: number) => {
        console.log('[NotificationService.markAsRead]', {
            url: `${API_BASE_URL}/notifications/${notificationId}/read`,
            method: 'PATCH',
        });
        const response = await api.patch(`/notifications/${notificationId}/read`);
        return response.data;
    },

    markAllAsRead: async () => {
        console.log('[NotificationService.markAllAsRead]', {
            url: `${API_BASE_URL}/notifications/read-all`,
            method: 'PATCH',
        });
        const response = await api.patch('/notifications/read-all');
        return response.data;
    },

    navigateFromNotification: async (navigation: any, notification: AppNotification) => {
        const meta = notification.metaData || {};
        const shopId = Number(meta.shopId || 0);
        const postId = Number(meta.postId || 0);
        const relationshipStatus = String(meta.relationshipStatus || '');
        const title = notification.title || '';
        const message = notification.message || '';

        if (relationshipStatus === 'pending') {
            return navigateSafe(navigation, 'Invitations');
        }

        if (
            includesText(title, 'CTV') ||
            includesText(message, 'cần bạn phê duyệt')
        ) {
            if (navigateSafe(navigation, 'PendingOwnerPosts')) {
                return true;
            }
        }

        if (postId > 0) {
            try {
                const slug = await resolvePostSlugFromMyPosts(postId);
                if (slug && navigateSafe(navigation, 'PostDetail', { slug })) {
                    return true;
                }
            } catch (error) {
                console.error('[Notification Navigation] Failed to resolve post slug:', {
                    postId,
                    error,
                });
            }

            if (navigateSafe(navigation, 'MyPost')) {
                return true;
            }
        }

        if (shopId > 0 && navigateSafe(navigation, 'PublicShopDetail', { shopId })) {
            return true;
        }

        if (
            includesText(title, 'gói') ||
            includesText(message, 'giao dịch') ||
            Number(meta.txnId || 0) > 0
        ) {
            if (navigateSafe(navigation, 'PersonalDashboard')) {
                return true;
            }

            if (navigateSafe(navigation, 'Packages')) {
                return true;
            }
        }

        return false;
    },
};

![](media/image67.png){width="2.9677832458442697in"
height="0.8118569553805774in"}

**[CAPSTONE PROJECT REPORT]{.smallcaps}**

**Report 3 -- Software Requirement Specification**

> -- Hanoi, January 2026 --

**Table of Contents**

[**I. Record of Changes**](#i.-record-of-changes) **9**

[**II. Software Requirement
Specification**](#ii.-software-requirement-specification) **10**

> [1. Overall Requirements](#overall-requirements) 10
>
> [1.1 Context Diagram](#context-diagram) 10
>
> [1.2 Main Workflows](#main-workflows) 10
>
> [1.2.1 WF-01 Customer Creates Store
> Flow](#wf-01-customer-creates-store-flow) 11
>
> [1.2.2 WF-02 Host Create Promotion Content
> Flow](#wf-02-host-create-promotion-content-flow) 12
>
> [1.2.3 WF-03 Collaborator Accept Task
> Flow](#wf-03-collaborator-accept-task-flow) 13
>
> [1.2.4 WF-04 Admin Manage Account
> Flow](#wf-04-admin-manage-account-flow) 14
>
> [1.2.5 WF-05 AI Recommendation Flow](#wf-05-ai-recommendation-flow) 15
>
> [1.3 User Requirements](#user-requirements) 15
>
> [1.3.1 Actors](#actors) 15
>
> [1.3.2 Use Cases (UC)](#use-cases-uc) 16
>
> [1.3.3 Use Case Diagrams](#use-case-diagrams) 22
>
> [1.4 System Functionalities](#system-functionalities) 28
>
> [1.4.1 Screens Flow](#screens-flow) 28
>
> [1.4.2 Screen Authorization](#screen-authorization) 29
>
> [1.4.3 Non-UI Functions](#non-ui-functions) 32
>
> [1.5 Entity Relationship Diagram](#entity-relationship-diagram) 33
>
> [2. Use Case Specification](#use-case-specification) 37
>
> [2.1 Authentication](#authentication) 37
>
> [2.1.1 Register phone number](#register-phone-number) 37
>
> [2.1.2 Login](#login) 38
>
> [2.1.3 Logout](#section-135) 39
>
> [2.2 Profile Management](#profile-management) 40
>
> [2.2.1 View profile](#view-profile) 40
>
> [2.2.2 Edit profile](#edit-profile) 41
>
> [2.3 Shop Management](#shop-management) 41
>
> [2.3.1 Create shop](#create-shop) 41
>
> [2.3.2 View shop details](#view-shop-details) 42
>
> [2.3.3 Edit shop](#edit-shop) 43
>
> [2.3.4 Manage shop status](#manage-shop-status) 44
>
> [2.3.5 Search shops](#search-shops) 44
>
> [2.3.6 View shop statistics](#view-shop-statistics) 45
>
> [2.4 Post Management](#post-management) 46
>
> [2.4.1 View news feed](#view-news-feed) 46
>
> [2.4.2 Search, filter and sort posts](#search-filter-and-sort-posts)
> 46
>
> [2.4.3 View post details](#view-post-details) 47
>
> [2.4.4 Share post](#share-post) 48
>
> [2.4.5 View my posts](#view-my-posts) 48
>
> [2.4.6 Create post](#create-post) 49
>
> [2.4.7 Edit post](#edit-post) 50
>
> [2.4.8 Move post to trash](#move-post-to-trash) 51
>
> [2.4.9 Restore post from trash](#restore-post-from-trash) 51
>
> [2.4.10 Permanently delete post](#permanently-delete-post) 52
>
> [2.4.11 Submit post for moderation](#submit-post-for-moderation) 53
>
> [2.4.12 View rejection reason](#view-rejection-reason) 53
>
> [2.4.13 Manage post images](#manage-post-images) 54
>
> [2.5 Favorite Management](#favorite-management) 55
>
> [2.5.1 Add post to favorites](#add-post-to-favorites) 55
>
> [2.5.2 Remove post from favorites](#remove-post-from-favorites) 56
>
> [2.5.3 View favorite posts](#view-favorite-posts) 56
>
> [2.5.4 Clear favorite list](#clear-favorite-list) 57
>
> [2.6 Reports Management](#reports-management) 58
>
> [2.6.1 Create report](#create-report) 58
>
> [2.6.2 Attach report evidence](#section-135) 58
>
> [2.6.3 View my reports](#view-my-reports) 59
>
> [2.6.4 Cancel report](#cancel-report) 60
>
> [2.6.5 View report result](#view-report-result) 60
>
> [2.7 Moderation Management](#moderation-management) 61
>
> [2.7.1 Block shop](#block-shop) 61
>
> [2.7.2 Unblock shop](#unblock-shop) 62
>
> [2.7.3 View moderation queue](#view-moderation-queue) 63
>
> [2.7.4 Moderate post](#section-135) 63
>
> [2.7.5 Resolve report](#resolve-report) 64
>
> [2.7.6 Send moderation feedback](#send-moderation-feedback) 65
>
> [2.7.7 View moderation history](#view-moderation-history) 65
>
> [2.7.8 View moderation statistics](#view-moderation-statistics) 66
>
> [2.7.9 Escalate violation](#escalate-violation) 67
>
> [2.8 Operations Staff Management](#operations-staff-management) 68
>
> [2.8.1 View assigned tasks](#view-assigned-tasks) 68
>
> [2.8.2 Handle customer support
> requests](#handle-customer-support-requests) 68
>
> [2.8.3 Update task status](#update-task-status) 69
>
> [2.8.4 View daily operation workload](#view-daily-operation-workload)
> 70
>
> [2.8.5 View system notifications](#view-system-notifications) 71
>
> [2.9 Collaborator Management](#collaborator-management) 71
>
> [2.9.1 View available jobs](#view-available-jobs) 71
>
> [2.9.2 Accept or decline job](#accept-or-decline-job) 72
>
> [2.9.3 View collaborator earnings](#view-collaborator-earnings) 73
>
> [2.9.4 Request payout](#request-payout) 73
>
> [2.9.5 Submit job result](#submit-job-result) 74
>
> [2.10 Host Management](#host-management) 75
>
> [2.10.1 View host dashboard](#view-host-dashboard) 75
>
> [2.10.2 Create promotional content](#create-promotional-content) 75
>
> [2.10.3 View host earnings](#view-host-earnings) 76
>
> [2.10.4 Request host payout](#request-host-payout) 77
>
> [2.11 Promotion & Placement
> Management](#promotion-placement-management) 78
>
> [2.11.1 View promotion packages](#view-promotion-packages) 78
>
> [2.11.2 Purchase promotion package
> (sandbox)](#purchase-promotion-package-sandbox) 78
>
> [2.11.3 Assign package to post (boost)](#section-135) 79
>
> [2.11.4 View boosted post status](#view-boosted-post-status) 80
>
> [2.11.5 Cancel boost / unassign
> package](#cancel-boost-unassign-package) 81
>
> [2.11.6 View my purchase history](#view-my-purchase-history) 82
>
> [2.12 Analytics Management](#_heading=h.17lz35fcoock) 82
>
> [2.12.1 View post performance](#view-post-performance) 82
>
> [2.12.2 View shop performance](#view-shop-performance) 83
>
> [2.12.3 View "best time to post"
> suggestion](#view-best-time-to-post-suggestion) 84
>
> [2.13 AI-assisted Insights](#ai-assisted-insights) 84
>
> [2.13.1 View AI recommendations
> (optional)](#view-ai-recommendations-optional) 84
>
> [2.13.2 View AI insight history
> (optional)](#view-ai-insight-history-optional) 85
>
> [2.14 Category & Attribute Management](#category-attribute-management)
> 86
>
> [2.14.1 View category list](#view-category-list) 86
>
> [2.14.2 Create category](#create-category) 87
>
> [2.14.3 Edit or disable category](#edit-or-disable-category) 87
>
> [2.14.4 View attribute list](#view-attribute-list) 88
>
> [2.14.5 Create attribute](#create-attribute) 89
>
> [2.14.6 Edit or disable attribute](#edit-or-disable-attribute) 90
>
> [2.14.7 Configure category attributes](#configure-category-attributes)
> 90
>
> [2.14.8 Preview post form
> configuration](#preview-post-form-configuration) 91
>
> [2.15 System Settings Management](#system-settings-management) 92
>
> [2.15.1 View system settings](#view-system-settings) 92
>
> [2.15.2 Update system settings](#update-system-settings) 93
>
> [2.15.3 Manage content rules (banned
> keywords)](#manage-content-rules-banned-keywords) 93
>
> [2.15.4 Manage post lifecycle rules](#manage-post-lifecycle-rules) 94
>
> [2.16 Account Management](#account-management) 95
>
> [2.16.1 View user accounts](#view-user-accounts) 95
>
> [2.16.2 Assign or remove roles](#assign-or-remove-roles) 95
>
> [2.16.3 Lock user account](#lock-user-account) 96
>
> [2.16.4 Unlock user account](#section-135) 97
>
> [2.16.5 View user role assignments](#view-user-role-assignments) 98
>
> [2.16.6 View account activity log](#view-account-activity-log) 98
>
> [2.17 Additional System Utilities](#additional-system-utilities) 99
>
> [2.17.1 Receive system notifications](#receive-system-notifications)
> 99
>
> [2.17.2 View system announcements](#view-system-announcements) 100
>
> [2.17.3 Manage notification settings](#manage-notification-settings)
> 100
>
> [2.17.4 Submit feedback to system](#submit-feedback-to-system) 101
>
> [2.18 System Dashboard & Export](#_heading=h.75uvpcp3j863) 102
>
> [2.18.1 View admin dashboard](#view-admin-dashboard) 102
>
> [2.18.2 Export data to CSV](#export-data-to-csv) 103
>
> [2.19 Promotion & Placement Admin
> Management](#promotion-placement-admin-management) 103
>
> [2.19.1 Manage placement slots](#manage-placement-slots) 103
>
> [2.19.2 Manage package plans](#manage-package-plans) 104
>
> [2.19.3 View promotions list](#view-promotions-list) 105
>
> [2.19.4 Enforce promotion rules](#enforce-promotion-rules) 105
>
> [2.20 Analytics Dashboard](#analytics-dashboard) 106
>
> [2.20.1 View placement analytics
> dashboard](#view-placement-analytics-dashboard) 106
>
> [2.20.2 View trend scoring report](#view-trend-scoring-report) 107
>
> [2.21 AI-assisted Insights](#ai-assisted-insights-1) 108
>
> [2.21.1 Generate AI insight summary
> (optional)](#generate-ai-insight-summary-optional) 108
>
> [2.21.2 Manage AI insight settings
> (optional)](#manage-ai-insight-settings-optional) 108
>
> [2.22 Financial Analytics](#financial-analytics) 109
>
> [2.22.1 View revenue summary](#view-revenue-summary) 109
>
> [2.22.2 View customer spending report
> (sandbox)](#view-customer-spending-report-sandbox) 110
>
> [2.22.3 Export financial report to CSV
> (sandbox)](#export-financial-report-to-csv-sandbox) 111
>
> [3. Functional Requirements](#functional-requirements) 111
>
> [3.1 Splash](#splash) 111
>
> [3.2 Authentication Management](#authentication-management) 113
>
> [3.2.1 Login](#login-1) 113
>
> [3.2.2 Verify OTP](#verify-otp) 115
>
> [3.2.3 Register](#register) 117
>
> [3.3 Profile Management](#profile-management-1) 120
>
> [3.3.1 View profile](#view-profile-1) 120
>
> [3.3.2 Edit Profile](#edit-profile-1) 121
>
> [3.4 Collaborator](#collaborator) 123
>
> [3.4.1 Earning](#earning) 124
>
> [3.4.2 Manage jobs](#manage-jobs) 125
>
> [3.4.3 My Jobs](#my-jobs) 127
>
> [3.4.4 Job Detail](#job-detail) 129
>
> [3.4.5 Submit Job Result](#submit-job-result-1) 131
>
> [3.4.6 Request payout](#request-payout-1) 133
>
> [3.5 Favorite](#favorite) 135
>
> [3.5.1 Favorite screen](#favorite-screen) 136
>
> [3.6 Host](#host) 138
>
> [3.6.1 Create Promotional Content](#create-promotional-content-1) 138
>
> [3.6.2 Host Dashboard](#host-dashboard) 140
>
> [3.6.3 Host Earning](#host-earning) 142
>
> [3.6.4 Request payout](#request-payout-2) 144
>
> [3.7 Home](#home) 146
>
> [3.7.1 Home](#home-1) 147
>
> [3.7.2 Post Detail](#post-detail) 149
>
> [3.7.3 Search & Filter](#search-filter) 151
>
> [3.8 Moderation](#moderation) 153
>
> [3.8.1 Moderation Dashboard](#moderation-dashboard) 154
>
> [3.8.2 Moderation History](#moderation-history) 156
>
> [3.8.3 Moderate Post Detail](#moderate-post-detail) 158
>
> [3.8.4 Moderate Post Detail](#moderate-post-detail-1) 160
>
> [3.8.5 Moderation Statistics](#moderation-statistics) 163
>
> [3.9 Operations](#operations) 165
>
> [3.9.1 Daily Workload](#daily-workload) 166
>
> [3.9.2 Task Detail](#task-detail) 167
>
> [3.9.3 Task Queue](#task-queue) 169
>
> [3.10 Reports](#reports) 171
>
> [3.10.1 My Reports](#my-reports) 171
>
> [3.10.2 Edit shop](#edit-shop-1) 173
>
> [3.10.3 Create Report](#create-report-1) 176
>
> [3.10.4 Blocked Shops](#blocked-shops) 178
>
> [3.11 Settings](#settings) 180
>
> [3.11.1 Feedback](#feedback) 181
>
> [3.11.2 Notifications](#notifications) 182
>
> [3.12 Shop](#shop) 186
>
> [3.12.1 Shop Detail](#shop-detail) 186
>
> [3.12.2 Shop Form](#shop-form) 188
>
> [3.12.3 Shop Search](#shop-search) 190
>
> [3.13 Promotions](#promotions) 192
>
> [3.13.1 Promotion Packages Screen](#promotion-packages-screen) 192
>
> [3.13.2 Purchase Package](#purchase-package) 194
>
> [3.13.3 Boost Post](#boost-post) 197
>
> [3.13.4 My Boosts](#my-boosts) 199
>
> [3.13.5 Transaction History](#transaction-history) 201
>
> [3.14 Analytics](#analytics) 203
>
> [3.14.1 AI Recommendations](#ai-recommendations) 203
>
> [3.14.2 Post Analytics](#post-analytics) 206
>
> [3.15 Admin Web](#admin-web) 208
>
> [3.15.1 System Analytics (Admin)](#system-analytics-admin) 208
>
> [3.15.2 Attribute Management (Admin)](#attribute-management-admin) 209
>
> [3.15.4 Admin Login](#admin-login) 211
>
> [3.15.5 Category Management (List)](#category-management-list) 212
>
> [3.15.6 Category Create / Edit](#category-create-edit) 213
>
> [3.15.7 Data Export](#data-export) 214
>
> [3.15.8 Category -- Attribute Mapping](#category-attribute-mapping)
> 216
>
> [3.15.9 Template Management](#template-management) 217
>
> [3.15.10 Template Builder](#template-builder) 218
>
> [3.15.11 User List](#user-list) 219
>
> [3.15.12 User Detail](#user-detail) 220
>
> [3.15.13 Activity Log](#activity-log) 222
>
> [3.15.14 Admin Dashboard](#admin-dashboard) 223
>
> [3.15.15 Placement Slot Management](#placement-slot-management) 225
>
> [3.15.16 Promotion Package Management](#promotion-package-management)
> 226
>
> [3.15.17 Boosted Posts Management](#boosted-posts-management) 227
>
> [3.15.18 AI Insights & Recommendation
> Settings](#ai-insights-recommendation-settings) 229
>
> [3.15.19 System Settings](#system-settings) 231
>
> [3.15.20 Bonsai Post Form Preview](#bonsai-post-form-preview) 232
>
> [3.15.21 Admin Analytics](#admin-analytics) 234
>
> [4. Non-Functional Requirements](#non-functional-requirements) 235
>
> [4.1 External Interfaces](#external-interfaces) 235
>
> [4.1.1 User Interface (UI)](#user-interface-ui) 235
>
> [4.1.2 Hardware Interfaces](#hardware-interfaces) 236
>
> [4.1.3 Software Integration Based on the secondary actors defined in
> the Use Case specifications, the system must integrate the following
> software
> interfaces:](#software-integration-based-on-the-secondary-actors-defined-in-the-use-case-specifications-the-system-must-integrate-the-following-software-interfaces)
> 236
>
> [4.2 Quality Attributes](#quality-attributes) 236
>
> [4.2.1 Usability](#usability) 236
>
> [4.2.2 Security](#security) 236
>
> [4.2.3 Performance](#performance) 236
>
> [4.2.4 Reliability & Availability](#reliability-availability) 237
>
> [5. Requirement Appendix](#_heading=) 238
>
> [5.1 Business Rules](#business-rules) 238
>
> [5.2 System Messages](#system-messages) 240

# I. Record of Changes

+------------+---------+----------+-----------------------------------------+
| **Date**   | **A\*** | **In     | **Change Description**                  |
|            |         | charge** |                                         |
|            | **M,    |          |                                         |
|            | D**     |          |                                         |
+------------+---------+----------+-----------------------------------------+
| 12/01/2026 | A       | NamPH    | Create Report 3 Document                |
+------------+---------+----------+-----------------------------------------+
| 16/01/2026 | M       | Team     | Update SRS for GreenMarket (new actors, |
|            |         |          | OTP sandbox, MoMo sandbox, 40 UCs,      |
|            |         |          | 4-month scope).                         |
+------------+---------+----------+-----------------------------------------+
| 18/01/2026 | M       | NamPH    | Update User Requirements                |
+------------+---------+----------+-----------------------------------------+
|            |         |          |                                         |
+------------+---------+----------+-----------------------------------------+
|            |         |          |                                         |
+------------+---------+----------+-----------------------------------------+
|            |         |          |                                         |
+------------+---------+----------+-----------------------------------------+
|            |         |          |                                         |
+------------+---------+----------+-----------------------------------------+
|            |         |          |                                         |
+------------+---------+----------+-----------------------------------------+
|            |         |          |                                         |
+------------+---------+----------+-----------------------------------------+
|            |         |          |                                         |
+------------+---------+----------+-----------------------------------------+
|            |         |          |                                         |
+------------+---------+----------+-----------------------------------------+
|            |         |          |                                         |
+------------+---------+----------+-----------------------------------------+
|            |         |          |                                         |
+------------+---------+----------+-----------------------------------------+
|            |         |          |                                         |
+============+=========+==========+=========================================+

\*A - Added M - Modified D - Deleted

# II. Software Requirement Specification

## 1. Overall Requirements

### 1.1 Context Diagram

  --------------------------------------------------------------------
  ![](media/image60.png){width="6.135416666666667in" height="4.125in"}
  --------------------------------------------------------------------

  --------------------------------------------------------------------

*Figure 1.1: Context diagram for GreenMarket*

Link diagram:
[[https://online.visual-paradigm.com/share.jsp?id=343432353536352d36]{.underline}](https://online.visual-paradigm.com/share.jsp?id=343432353536352d36)

###  

### 1.2 Main Workflows

#### 1.2.1 WF-01 Customer Creates Store Flow 

  --------------------------------------------------------------------
  ![](media/image83.png){width="6.135416666666667in"
  height="3.0694444444444446in"}
  --------------------------------------------------------------------

  --------------------------------------------------------------------

Figure 1.2.1: Customer Creates Store Flow

Link Diagram: [[Link
Diagram]{.underline}](https://drive.google.com/file/d/1zXxgLI9iIzn9gg1rz-4PkVWJ3JdXpppN/view?usp=sharing)

#### 1.2.2 WF-02 Host Create Promotion Content Flow 

  --------------------------------------------------------------------
  ![](media/image82.png){width="6.135416666666667in"
  height="5.041666666666667in"}
  --------------------------------------------------------------------

  --------------------------------------------------------------------

Figure 1.2.2: Host Create Promotion Content Flow

Link Diagram: [[link
diagram]{.underline}](https://drive.google.com/file/d/1_PF6_ZXMO8KOpY2WCrX2mFdnOkTvyzIS/view?usp=sharing)

####  

#### 1.2.3 WF-03 Collaborator Accept Task Flow 

  --------------------------------------------------------------------
  ![](media/image77.png){width="6.135416666666667in"
  height="3.611111111111111in"}
  --------------------------------------------------------------------

  --------------------------------------------------------------------

Figure 1.2.3: Collaborator Accept Task Flow

Link Diagram: [[link
diagram]{.underline}](https://drive.google.com/file/d/1HncREQWr7HaXKJM_eaWB13UY-O-1J88N/view?usp=sharing)

####  

#### 1.2.4 WF-04 Admin Manage Account Flow

  --------------------------------------------------------------------
  ![](media/image81.png){width="6.135416666666667in"
  height="2.8472222222222223in"}
  --------------------------------------------------------------------

  --------------------------------------------------------------------

Figure 1.2.4: Admin Manage Account Flow

Link Diagram: [[link
diagram]{.underline}](https://drive.google.com/file/d/1FAvDQgBxt07GkjeW4JZ3GcxnGZk_Mmic/view?usp=sharing)

#### 1.2.5 WF-05 AI Recommendation Flow

  --------------------------------------------------------------------
  ![](media/image20.png){width="6.135416666666667in"
  height="3.5972222222222223in"}
  --------------------------------------------------------------------

  --------------------------------------------------------------------

Figure 1.2.5: AI Recommendation Flow

Link Diagram: [[link
diagram]{.underline}](https://drive.google.com/file/d/1GU3pKB19uxbCOAZgo0WTc3GdMtb5r-kq/view?usp=sharing)

### 1.3 User Requirements

#### 1.3.1 Actors

  ----------------------------------------------------------------------
  **\#**   **Actor**      **Description**
  -------- -------------- ----------------------------------------------
  1        Guest          Unauthenticated app user. Can
                          browse/search/view listings and submit
                          reports.

  2        Customer       Authenticated user (buyer/seller). Can create
                          storefront, post listings, manage favorites,
                          and report content.

  3        Manager        Operational moderator on the app. Reviews
                          moderation queue, approves/rejects/hides
                          listings, and resolves reports.

  4        Admin          System administrator (web only). Configures
                          taxonomy/attributes, manages templates (UC30),
                          provisions internal roles, analytics/export.

  5        Host           Content contributor/affiliate. Publishes
                          content/webinar announcements and views
                          earnings statement (mock).

  6        Collaborator   Freelance service provider. Maintains service
                          profile and accepts customer jobs
                          (photo/content assistance).

  7        Operations     Internal staff supporting operations
           Staff          (tasks/tickets) in a minimal scope.

  8        Payment        External payment sandbox used for demo of
           Gateway (Momo  plans/featured listings.
           sandbox)       

  9        OTP/SMS        External OTP/SMS sandbox used to
           Sandbox (Mock) generate/verify OTP codes for phone-based
                          login in demo mode (no real SMS cost).
  ----------------------------------------------------------------------

#### 

#### 1.3.2 Use Cases (UC)

+--------------------+--------------------+--------------------+----------------------------+
| **ID**             | **Use Case**       | **Feature**        | **Use Case Description**   |
+--------------------+--------------------+--------------------+----------------------------+
| **App-based**                                                                             |
+--------------------+--------------------+--------------------+----------------------------+
| UC01               | Register phone     | Authentication     | Register account using     |
|                    | number             |                    | phone number.              |
+--------------------+--------------------+                    +----------------------------+
| UC02               | Login              |                    | Log in to the system.      |
+--------------------+--------------------+                    +----------------------------+
| UC03               | Logout             |                    | Log out from the system.   |
+--------------------+--------------------+--------------------+----------------------------+
| UC04               | View profile       | Profile Management | Displays current user      |
|                    |                    |                    | profile information and    |
|                    |                    |                    | role details.              |
+--------------------+--------------------+                    +----------------------------+
| UC05               | Edit profile       |                    | Edit profile details.      |
+--------------------+--------------------+--------------------+----------------------------+
| UC06               | Create shop        | Shop Management    | The customer creates a     |
|                    |                    |                    | shop profile (name, phone, |
|                    |                    |                    | location, description).    |
+--------------------+--------------------+                    +----------------------------+
| UC07               | View shop details  |                    | Displays shop profile and  |
|                    |                    |                    | its published listings.    |
+--------------------+--------------------+                    +----------------------------+
| UC08               | Edit shop          |                    | Customer updates shop      |
|                    |                    |                    | information and images.    |
+--------------------+--------------------+                    +----------------------------+
| UC09               | Manage shop status |                    | Close or reopen the shop   |
|                    |                    |                    | temporarily.               |
+--------------------+--------------------+                    +----------------------------+
| UC10               | Search shops       |                    | Search shops by keyword or |
|                    |                    |                    | location.                  |
+--------------------+--------------------+                    +----------------------------+
| UC11               | View shop          |                    | View shop performance      |
|                    | statistics         |                    | statistics.                |
+--------------------+--------------------+--------------------+----------------------------+
| UC12               | View news feed     | Post Management    | Browse latest posts.       |
+--------------------+--------------------+                    +----------------------------+
| UC13               | Search, filter and |                    | Search, filter, sort, and  |
|                    | sort posts         |                    | view trending or           |
|                    |                    |                    | recommended posts.         |
+--------------------+--------------------+                    +----------------------------+
| UC14               | View post details  |                    | View detailed information  |
|                    |                    |                    | of a post.                 |
+--------------------+--------------------+                    +----------------------------+
| UC15               | Share post         |                    | Share post link.           |
+--------------------+--------------------+                    +----------------------------+
| UC16               | View my posts      |                    | View list of my own posts. |
+--------------------+--------------------+                    +----------------------------+
| UC17               | Create post        |                    | Create a new post.         |
+--------------------+--------------------+                    +----------------------------+
| UC18               | Edit post          |                    | Edit post information      |
|                    |                    |                    | (price, visibility,        |
|                    |                    |                    | content).                  |
+--------------------+--------------------+                    +----------------------------+
| UC19               | Move post to trash |                    | Soft delete a post.        |
+--------------------+--------------------+                    +----------------------------+
| UC20               | Restore post from  |                    | Restore deleted posts      |
|                    | trash              |                    | within 30 days.            |
+--------------------+--------------------+                    +----------------------------+
| UC21               | Permanently delete |                    | Permanently delete posts   |
|                    | post               |                    | after 30 days.             |
+--------------------+--------------------+                    +----------------------------+
| UC22               | Submit post for    |                    | Submit post for approval.  |
|                    | moderation         |                    |                            |
+--------------------+--------------------+                    +----------------------------+
| UC23               | View rejection     |                    | View reason if post is     |
|                    | reason             |                    | rejected.                  |
+--------------------+--------------------+                    +----------------------------+
| UC24               | Manage post images |                    | Upload, remove, and        |
|                    |                    |                    | reorder images.            |
+--------------------+--------------------+--------------------+----------------------------+
| UC25               | Add post to        | Favorite           | Add a post to your         |
|                    | favorites          | Management         | favorite list.             |
+--------------------+--------------------+                    +----------------------------+
| UC26               | Remove post from   |                    | Remove posts from          |
|                    | favorites          |                    | favorites.                 |
+--------------------+--------------------+                    +----------------------------+
| UC27               | View favorite      |                    | View list of favorite      |
|                    | posts              |                    | posts.                     |
+--------------------+--------------------+                    +----------------------------+
| UC28               | Clear favorite     |                    | Remove all favorite posts. |
|                    | list               |                    |                            |
+--------------------+--------------------+--------------------+----------------------------+
| UC29               | Create report      | Reports Management | Report a post or shop.     |
+--------------------+--------------------+                    +----------------------------+
| UC30               | Attach report      |                    | Attach evidence to report. |
|                    | evidence           |                    |                            |
+--------------------+--------------------+                    +----------------------------+
| UC31               | View my reports    |                    | View submitted reports.    |
+--------------------+--------------------+                    +----------------------------+
| UC32               | Cancel report      |                    | Cancel a report before     |
|                    |                    |                    | processing.                |
+--------------------+--------------------+                    +----------------------------+
| UC33               | View report result |                    | View report handling       |
|                    |                    |                    | result.                    |
+--------------------+--------------------+                    +----------------------------+
| UC34               | Block shop         |                    | Block a shop.              |
+--------------------+--------------------+                    +----------------------------+
| UC35               | Unblock shop       |                    | Unblock a previously       |
|                    |                    |                    | blocked shop.              |
+--------------------+--------------------+--------------------+----------------------------+
| UC36               | View moderation    | Moderation         | View pending and reported  |
|                    | queue              | Management         | posts.                     |
+--------------------+--------------------+                    +----------------------------+
| UC37               | Moderate post      |                    | Approve, reject, hide, or  |
|                    |                    |                    | unhide posts.              |
+--------------------+--------------------+                    +----------------------------+
| UC38               | Resolve report     |                    | Handle and close reports.  |
+--------------------+--------------------+                    +----------------------------+
| UC39               | Send moderation    |                    | Send feedback to the post  |
|                    | feedback           |                    | owner.                     |
+--------------------+--------------------+                    +----------------------------+
| UC40               | View moderation    |                    | View moderation actions    |
|                    | history            |                    | history.                   |
+--------------------+--------------------+                    +----------------------------+
| UC41               | View moderation    |                    | View moderation workload   |
|                    | statistics         |                    | statistics.                |
+--------------------+--------------------+                    +----------------------------+
| UC42               | Escalate violation |                    | Escalate serious violation |
|                    |                    |                    | to admin.                  |
+--------------------+--------------------+--------------------+----------------------------+
| UC43               | View assigned      | Operations Staff   | View assigned tasks.       |
|                    | tasks              | Management         |                            |
+--------------------+--------------------+                    +----------------------------+
| UC44               | Handle customer    |                    | Handle user support        |
|                    | support requests   |                    | tickets.                   |
+--------------------+--------------------+                    +----------------------------+
| UC45               | Update task status |                    | Update task progress.      |
+--------------------+--------------------+                    +----------------------------+
| UC46               | View daily         |                    | View daily workload.       |
|                    | operation workload |                    |                            |
+--------------------+--------------------+                    +----------------------------+
| UC47               | View system        |                    | View system notifications. |
|                    | notifications      |                    |                            |
+--------------------+--------------------+--------------------+----------------------------+
| UC48               | View available     | Collaborator       | View available service     |
|                    | jobs               | Management         | jobs.                      |
+--------------------+--------------------+                    +----------------------------+
| UC49               | Accept or decline  |                    | Accept or decline a job.   |
|                    | job                |                    |                            |
+--------------------+--------------------+                    +----------------------------+
| UC50               | View collaborator  |                    | View earnings.             |
|                    | earnings           |                    |                            |
+--------------------+--------------------+                    +----------------------------+
| UC51               | Request payout     |                    | Request payout.            |
+--------------------+--------------------+                    +----------------------------+
| UC52               | Submit job result  |                    | Submit completed work.     |
+--------------------+--------------------+--------------------+----------------------------+
| UC53               | View host          | Host Management    | View host dashboard.       |
|                    | dashboard          |                    |                            |
+--------------------+--------------------+                    +----------------------------+
| UC54               | Create promotional |                    | Create promotional         |
|                    | content            |                    | content.                   |
+--------------------+--------------------+                    +----------------------------+
| UC55               | View host earnings |                    | View earnings.             |
+--------------------+--------------------+                    +----------------------------+
| UC56               | Request host       |                    | Request payout.            |
|                    | payout             |                    |                            |
+--------------------+--------------------+--------------------+----------------------------+
| UC57               | View promotion     | Promotion &        | Customer views available   |
|                    | packages           | Placement          | promotion packages by slot |
|                    |                    | Management         | (Home/Category/Search),    |
|                    |                    |                    | duration, and price        |
|                    |                    |                    | (sandbox).                 |
+--------------------+--------------------+                    +----------------------------+
| UC58               | Purchase promotion |                    | Customer purchases a       |
|                    | package (sandbox)  |                    | package via MoMo sandbox   |
|                    |                    |                    | and receives purchase      |
|                    |                    |                    | status.                    |
+--------------------+--------------------+                    +----------------------------+
| UC59               | Assign package to  |                    | Customer selects a post    |
|                    | post (boost)       |                    | and assigns an active      |
|                    |                    |                    | package to boost it in a   |
|                    |                    |                    | chosen slot.               |
+--------------------+--------------------+                    +----------------------------+
| UC60               | View boosted post  |                    | Customer views boost       |
|                    | status             |                    | status (active/expired),   |
|                    |                    |                    | slot, start/end date.      |
+--------------------+--------------------+                    +----------------------------+
| UC61               | Cancel boost /     |                    | Customer cancels a boost   |
|                    | unassign package   |                    | (if policy allows) and the |
|                    |                    |                    | post returns to normal     |
|                    |                    |                    | ranking.                   |
+--------------------+--------------------+                    +----------------------------+
| UC62               | View my purchase   |                    | Customer views their       |
|                    | history            |                    | purchased promotion        |
|                    |                    |                    | packages and payment       |
|                    |                    |                    | status (sandbox),          |
|                    |                    |                    | including slot, duration,  |
|                    |                    |                    | price, and effective time. |
+--------------------+--------------------+--------------------+----------------------------+
| UC63               | View post          | Analytics          | Customer views post        |
|                    | performance        | Management         | analytics                  |
|                    |                    |                    | (impressions/clicks/detail |
|                    |                    |                    | views/contact clicks) in   |
|                    |                    |                    | last 7/30 days.            |
+--------------------+--------------------+                    +----------------------------+
| UC64               | View shop          |                    | Customer views shop-level  |
|                    | performance        |                    | analytics (views, top      |
|                    |                    |                    | posts, engagement trend).  |
+--------------------+--------------------+                    +----------------------------+
| UC65               | View "best time to |                    | Customer sees suggested    |
|                    | post" suggestion   |                    | peak hours/time windows    |
|                    |                    |                    | derived from recent        |
|                    |                    |                    | engagement stats (no AI    |
|                    |                    |                    | required).                 |
+--------------------+--------------------+--------------------+----------------------------+
| UC66               | View AI            | AI-assisted        | Customer requests          |
|                    | recommendations    | Insights           | AI-written recommendations |
|                    | (optional)         |                    | based on computed metrics  |
|                    |                    |                    | (slot CTR, category        |
|                    |                    |                    | hotness, peak hours).      |
+--------------------+--------------------+                    +----------------------------+
| UC67               | View AI insight    |                    | Customer views previously  |
|                    | history (optional) |                    | generated AI insight       |
|                    |                    |                    | summaries (stored text).   |
+--------------------+--------------------+--------------------+----------------------------+
| **Web-based**                                                                             |
+--------------------+--------------------+--------------------+----------------------------+
| UC68               | View category list | Category &         | View all categories.       |
|                    |                    | Attribute          |                            |
|                    |                    | Management         |                            |
+--------------------+--------------------+                    +----------------------------+
| UC69               | Create category    |                    | Create a new category.     |
+--------------------+--------------------+                    +----------------------------+
| UC70               | Edit or disable    |                    | Edit or disable a          |
|                    | category           |                    | category.                  |
+--------------------+--------------------+                    +----------------------------+
| UC71               | View attribute     |                    | View list of attributes.   |
|                    | list               |                    |                            |
+--------------------+--------------------+                    +----------------------------+
| UC72               | Create attribute   |                    | Create new attributes.     |
+--------------------+--------------------+                    +----------------------------+
| UC73               | Edit or disable    |                    | Edit or disable attribute. |
|                    | attribute          |                    |                            |
+--------------------+--------------------+                    +----------------------------+
| UC74               | Configure category |                    | Assign attributes to       |
|                    | attributes         |                    | categories.                |
+--------------------+--------------------+                    +----------------------------+
| UC75               | Preview post form  |                    | Preview post creation      |
|                    | configuration      |                    | form.                      |
+--------------------+--------------------+--------------------+----------------------------+
| UC76               | View system        | System Settings    | View current system        |
|                    | settings           | Management         | configuration (OTP sandbox |
|                    |                    |                    | mode, post limits, report  |
|                    |                    |                    | limits, etc.).             |
+--------------------+--------------------+                    +----------------------------+
| UC77               | Update system      |                    | Admin updates system       |
|                    | settings           |                    | configurations (e.g., max  |
|                    |                    |                    | images per post, post      |
|                    |                    |                    | expiry days, rate limits). |
+--------------------+--------------------+                    +----------------------------+
| UC78               | Manage content     |                    | Admin maintains banned     |
|                    | rules (banned      |                    | keywords list to pre-check |
|                    | keywords)          |                    | post content (basic        |
|                    |                    |                    | anti-spam).                |
+--------------------+--------------------+                    +----------------------------+
| UC79               | Manage post        |                    | Configure post             |
|                    | lifecycle rules    |                    | status/lifecycle rules     |
|                    |                    |                    | (e.g., auto-expire after N |
|                    |                    |                    | days; trash restore within |
|                    |                    |                    | 30 days).                  |
+--------------------+--------------------+--------------------+----------------------------+
| UC80               | View user accounts | Account Management | View all user accounts.    |
+--------------------+--------------------+                    +----------------------------+
| UC81               | Assign or remove   |                    | Assign or remove system    |
|                    | roles              |                    | roles.                     |
+--------------------+--------------------+                    +----------------------------+
| UC82               | Lock user account  |                    | Lock user account.         |
+--------------------+--------------------+                    +----------------------------+
| UC83               | Unlock user        |                    | Unlock user account.       |
|                    | account            |                    |                            |
+--------------------+--------------------+                    +----------------------------+
| UC84               | View user role     |                    | View role assignments of   |
|                    | assignments        |                    | users.                     |
+--------------------+--------------------+                    +----------------------------+
| UC85               | View account       |                    | View account activity      |
|                    | activity log       |                    | history.                   |
+--------------------+--------------------+--------------------+----------------------------+
| UC86               | Receive system     | Additional System  | Receive system             |
|                    | notifications      | Utilities          | notifications.             |
+--------------------+--------------------+                    +----------------------------+
| UC87               | View system        |                    | View system announcements. |
|                    | announcements      |                    |                            |
+--------------------+--------------------+                    +----------------------------+
| UC88               | Manage             |                    | Enable or disable          |
|                    | notification       |                    | notifications.             |
|                    | settings           |                    |                            |
+--------------------+--------------------+                    +----------------------------+
| UC89               | Submit feedback to |                    | Submit feedback or         |
|                    | system             |                    | suggestions.               |
+--------------------+--------------------+--------------------+----------------------------+
| UC90               | View admin         | System Dashboard & | View high-level KPIs       |
|                    | dashboard          | Export             | overview (total            |
|                    |                    |                    | posts/shops, pending       |
|                    |                    |                    | moderation, reports, basic |
|                    |                    |                    | traffic summary) for a     |
|                    |                    |                    | selected time range.       |
+--------------------+--------------------+                    +----------------------------+
| UC91               | Export data to CSV |                    | Export system data to CSV  |
|                    |                    |                    | with filters (time range,  |
|                    |                    |                    | category, shop, status),   |
|                    |                    |                    | including posts, shops,    |
|                    |                    |                    | reports/moderation, and    |
|                    |                    |                    | placement analytics (slot  |
|                    |                    |                    | CTR/click/contact          |
|                    |                    |                    | conversion).               |
+--------------------+--------------------+--------------------+----------------------------+
| UC92               | Manage placement   | Promotion &        | Admin CRUD placement       |
|                    | slots              | Placement Admin    | slots:                     |
|                    |                    | Management         | create/list/update/disable |
|                    |                    |                    | slots (Home Top/Category   |
|                    |                    |                    | Top/Search Boost) with     |
|                    |                    |                    | scope, position, priority, |
|                    |                    |                    | and capacity. Slots        |
|                    |                    |                    | control where boosted      |
|                    |                    |                    | posts are displayed and    |
|                    |                    |                    | enforce visibility         |
|                    |                    |                    | limits/rules.              |
+--------------------+--------------------+                    +----------------------------+
| UC93               | Manage package     |                    | Admin                      |
|                    | plans              |                    | creates/updates/disables   |
|                    |                    |                    | package plans (slot,       |
|                    |                    |                    | duration, price).          |
+--------------------+--------------------+                    +----------------------------+
| UC94               | View promotions    |                    | Admin views all            |
|                    | list               |                    | active/expired boosts by   |
|                    |                    |                    | post/customer, slot, time  |
|                    |                    |                    | window.                    |
+--------------------+--------------------+                    +----------------------------+
| UC95               | Enforce promotion  |                    | Admin applies policy       |
|                    | rules              |                    | (limit per post, slot      |
|                    |                    |                    | capacity, cooldown) and    |
|                    |                    |                    | resolves conflicts.        |
+--------------------+--------------------+--------------------+----------------------------+
| UC96               | View placement     | Analytics          | View detailed placement    |
|                    | analytics          | Management         | performance metrics by     |
|                    | dashboard          |                    | slot/category/time         |
|                    |                    |                    | (impressions, clicks, CTR, |
|                    |                    |                    | contact conversion) for    |
|                    |                    |                    | 7/30 days.                 |
+--------------------+--------------------+                    +----------------------------+
| UC97               | View trend scoring |                    | View computed trend scores |
|                    | report             |                    | (slot score, hot           |
|                    |                    |                    | categories, peak hours)    |
|                    |                    |                    | using heuristic formula    |
|                    |                    |                    | and moving                 |
|                    |                    |                    | average/smoothing over     |
|                    |                    |                    | recent period.             |
+--------------------+--------------------+--------------------+----------------------------+
| UC99               | Generate AI        | AI-assisted        | Admin requests             |
|                    | insight summary    | Insights           | AI-generated summary from  |
|                    | (optional)         |                    | aggregated metrics (no raw |
|                    |                    |                    | user data).                |
+--------------------+--------------------+                    +----------------------------+
| UC100              | Manage AI insight  |                    | Configure AI insights      |
|                    | settings           |                    | (enable/disable, prompt    |
|                    | (optional)         |                    | template, refresh          |
|                    |                    |                    | frequency, output format)  |
|                    |                    |                    | based on aggregated        |
|                    |                    |                    | analytics only (no raw     |
|                    |                    |                    | personal data).            |
+--------------------+--------------------+--------------------+----------------------------+
| UC101              | View revenue       | Financial          | Admin views total revenue  |
|                    | summary            | Analytics          | from promotion packages by |
|                    |                    |                    | time range (7/30 days),    |
|                    |                    |                    | slot, and package plan     |
|                    |                    |                    | (sandbox payment records). |
+--------------------+--------------------+                    +----------------------------+
| UC102              | View customer      |                    | Admin views each           |
|                    | spending report    |                    | customer's total spending  |
|                    | (sandbox)          |                    | and purchase history for   |
|                    |                    |                    | promotion packages (plan,  |
|                    |                    |                    | slot, amount, status)      |
|                    |                    |                    | within a selected time     |
|                    |                    |                    | range.                     |
+--------------------+--------------------+                    +----------------------------+
| UC103              | Export financial   |                    | Admin exports promotion    |
|                    | report to CSV      |                    | revenue/spending report to |
|                    | (sandbox)          |                    | CSV with filters (date     |
|                    |                    |                    | range, slot, plan, status) |
|                    |                    |                    | for reporting and          |
|                    |                    |                    | analysis.                  |
+====================+====================+====================+============================+

#### 

#### 1.3.3 Use Case Diagrams

1.3.3.1 : UCs for Guest

　![](media/image42.png){width="6.284383202099738in"
height="4.166666666666667in"}

*Figure 1.3.1: Use Case Diagram for Guest*

Link diagram
:[[GuestUseCase.drawio.png]{.underline}](https://drive.google.com/file/d/1RA-1CqZ1ovzslUgQOjgaUIBVlc0hQ4Bz/view)

1.3.3.2 : UCs for Customer

![](media/image65.png){width="6.284383202099738in"
height="5.819444444444445in"}

*Figure 1.3.2: Use Case Diagram for Customer*

*Link diagram:
[[-CustomerUseCase.drawio.png]{.underline}](https://drive.google.com/file/d/11lruLTVz09qcTibgU3YaBTNJeL_-J88B/view)*

1.3.3.3: UCs for Manager

![](media/image40.png){width="6.284383202099738in" height="4.125in"}

*Figure 1.3.3: Use Case Diagram for Manager*

Link diagram:
[[-ManagerUseCase.drawio.png]{.underline}](https://drive.google.com/file/d/1uzGCTUH2Y9Hv8LA_PT4MzmDt2hg8vMsZ/view)

1.3.3.4 : UCs for Admin

![](media/image52.png){width="6.284383202099738in"
height="4.013888888888889in"}

*Figure 1.3.4: Use Case Diagram for Admin*

Link
diagram:[[-AdminUseCase.drawio.png]{.underline}](https://drive.google.com/file/d/10wg9KsA-wWvMjB2gPLCpeeNvlOhj4Qaw/view)

1.3.3.5 : UCs for Host

![](media/image71.png){width="6.284383202099738in"
height="4.555555555555555in"}

*Figure 1.3.5: Use Case Diagram for Host*

Link
diagram:[[-HostUseCase.drawio.png]{.underline}](https://drive.google.com/file/d/1Z1q3lJm_8WEhR-j1l5E5rlatmC3U714e/view)

1.3.3.6 : UCs for Collaborator

![](media/image78.png){width="6.284383202099738in"
height="4.555555555555555in"}

*Figure 1.3.6: Use Case Diagram for Collaborator*

Link diagram:
[[-CollaboratorUseCase.drawio.png]{.underline}](https://drive.google.com/file/d/1wBwjXzBZFo8lqFdYW5nshDMLHE5fSBPu/view)

1.3.3.7 : UCs for Operations Staff

![](media/image62.png){width="6.284383202099738in"
height="3.4444444444444446in"}

*Figure 1.3.7: Use Case Diagram for Operations Staff*

Link
diagram:[[-OperationStaffUseCase.drawio.png]{.underline}](https://drive.google.com/file/d/1U6FTO_QJAS0QDA2RuWNYCWMdRI_EDNGU/view)

### 1.4 System Functionalities

#### 1.4.1 Screens Flow

![](media/image33.png){width="6.284383202099738in"
height="3.1527777777777777in"}

*Figure 1.4.1: Screen Flow of GM*

*Link diagram:
[[https://online.visual-paradigm.com/share.jsp?id=333231303735362d32]{.underline}](https://online.visual-paradigm.com/share.jsp?id=333231303735362d32)*

#### 1.4.2 Screen Authorization

***Legend: \'X\' means the role can access the screen/module. Admin
functions are on Web Admin; other roles use Mobile App.***

  -------------------------------------------------------------------------------------------------------------------------
  **Screen / Module**       **Guest**   **Customer**   **Manager**   **Host**   **Collaborator**   **Operations   **Admin
                                                                                                   Staff**        (Web)**
  ------------------------- ----------- -------------- ------------- ---------- ------------------ -------------- ---------
  Mobile -- Landing / Home  X           X              X             X          X                  X              
  Feed                                                                                                            

  Mobile -- Register Phone  X           X              X             X          X                  X              

  Mobile -- OTP Login       X           X              X             X          X                  X              

  Mobile -- Profile                     X              X             X          X                  X              
  (View/Edit)                                                                                                     

  Mobile -- News            X           X              X             X          X                  X              
  (Search/Filter/Sort)                                                                                            

  Mobile -- Post Detail     X           X              X             X          X                  X              
  (Share / Phone contact)                                                                                         

  Mobile -- Shop Detail     X           X              X             X          X                  X              

  Mobile -- Create/Edit                 X                                                                         
  Shop                                                                                                            

  Mobile -- Shop Statistics             X                                                                         

  Mobile -- My Posts (list              X                                                                         
  by status)                                                                                                      

  Mobile -- Create/Edit                 X                                                                         
  Post + Image upload                                                                                             

  Mobile -- Submit Post /               X                                                                         
  View Rejection Reason                                                                                           

  Mobile -- Favorites                   X                                                                         

  Mobile -- Reports         X           X                                                                         
  (create/view my reports)                                                                                        

  Mobile -- Blocked Shops               X                                                                         

  Mobile -- Moderation                                 X                                                          
  Queue                                                                                                           

  Mobile -- Moderation                                 X                                                          
  Action                                                                                                          
  (approve/reject/hide)                                                                                           

  Mobile -- Report Queue /                             X                                                          
  Resolve Reports                                                                                                 

  Mobile -- Collaborator                                                        X                                 
  Jobs                                                                                                            

  Mobile -- Collaborator                                                        X                                 
  Earnings & Payout (mock)                                                                                        

  Mobile -- Host Dashboard                                           X                                            
  & Content                                                                                                       

  Mobile -- Host Earnings &                                          X                                            
  Payout (mock)                                                                                                   

  Mobile -- Operations                                                                             X              
  Tasks / Support                                                                                                 

  Web Admin -- Admin Login                                                                                        X

  Web Admin -- Dashboard &                                                                                        X
  KPI                                                                                                             

  Web Admin -- Account                                                                                            X
  Management                                                                                                      
  (roles/lock/unlock/log)                                                                                         

  Web Admin -- Category &                                                                                         X
  Attribute Management                                                                                            

  Web Admin --                                                                                                    X
  Category-Attribute                                                                                              
  Configuration                                                                                                   

  Web Admin -- Template                                                                                           X
  Management                                                                                                      

  Web Admin -- Export CSV                                                                                         X
  -------------------------------------------------------------------------------------------------------------------------

Note: Screens not available to Guest require an authenticated session
(OTP login).

#### 1.4.3 Non-UI Functions

  ------------------------------------------------------------------------------------------------------
  **\#**   **Feature**      **System Function**   **Description**
  -------- ---------------- --------------------- ------------------------------------------------------
  1        OTP/SMS Sandbox  Generate OTP code     Generate OTP for demo mode and return via response/log
           (Mock)                                 (no real SMS cost).

  2        Authentication   JWT token             Issue and validate JWT tokens after OTP verification;
                            issuance/validation   handle expiry and logout.

  3        Authorization    Role-based API guards Enforce role permissions
           (RBAC)                                 (Guest/Customer/Manager/Host/Collaborator/Operations
                                                  Staff/Admin) on all APIs.

  4        Data Performance PostgreSQL indexes    Apply compound/text indexes to support search/filter
                                                  and queue queries (moderation/reports).

  5        ORM              Prisma                Data access via Prisma ORM (schema, migrations, query
                                                  layer) for PostgreSQL
  ------------------------------------------------------------------------------------------------------

###  

### 1.5 Entity Relationship Diagram

![](media/image70.png){width="6.284383202099738in"
height="8.041666666666666in"}

*Figure 1.5.2: Logical ERD of GM*

Link diagram: [[Logical ERD
diagram]{.underline}](https://drive.google.com/file/d/1BRHX1Qs5aZbGiglJkKtWXZkPu_H_t-xS/view?usp=sharing)

![](media/image79.jpg){width="6.284383202099738in"
height="4.944444444444445in"}

*Figure 1.5.3: Physical ERD of GM*

Link diagram:

**[Entities Description:]{.underline}**

  --------------------------------------------------------------------------------------------------
  **[\#]{.underline}**   **[Entity]{.underline}**   **[Description]{.underline}**
  ---------------------- -------------------------- ------------------------------------------------
  1                      Account                    User identity and authentication data (unique
                                                    phone number, status, createdAt).

  2                      Role                       System role definition (Guest, Customer,
                                                    Manager, Admin, OperationsStaff, Collaborator,
                                                    Host).

  3                      AccountRole                Many-to-many mapping between Account and Role.

  4                      Shop                       Customer shop profile (name, contact phone,
                                                    location, description, status, ownerAccountId).

  5                      Post                       Plant post created by a shop (content, price,
                                                    location, status:
                                                    Draft/Pending/Approved/Rejected/Hidden/Trash).

  6                      PostImage                  Image metadata for a post (url, orderIndex,
                                                    isCover, postId).

  7                      Category                   Plant category taxonomy (name, order, status).

  8                      Attribute                  Attribute field definition (type, options,
                                                    status) used for structured post data.

  9                      CategoryAttributeConfig    Config which attributes are used for each
                                                    category (required/optional, order, inputType).

  10                     PostAttributeValue         Stores attribute values for a post (postId,
                                                    attributeId, value).

  11                     Template                   Post template content for quick posting and
                                                    quality improvement.

  12                     ModerationQueueItem        Represents a post queued for moderation (postId,
                                                    reason, queuedAt).

  13                     ModerationActionLog        Logs moderation decisions
                                                    (approve/reject/hide/unhide) with actor, time,
                                                    and note/template.

  14                     RejectionReason            Predefined rejection reasons/templates used in
                                                    moderation feedback.

  15                     Report                     Report submitted against Post/Shop (reasonCode,
                                                    note, status).

  16                     ReportEvidence             Evidence attached to a report (file/image URL).

  17                     ReportResolution           Resolution result for a report (actionType,
                                                    note, resolvedBy, resolvedAt).

  18                     BlockedShop                Customer blocks a shop to hide its posts
                                                    (customerAccountId, shopId).

  19                     Favorite                   Favorite relation between Customer and Post.

  20                     Notification               In-app notification event (type, content,
                                                    receiverId, readStatus).

  21                     NotificationPreference     Per-user notification settings.

  22                     Announcement               System announcements visible to Guest/Customer.

  23                     Feedback                   Customer feedback submissions for system
                                                    improvement.

  24                     OTPRequest                 OTP request record (sandbox): phone, expiresAt,
                                                    attempts, rateLimitWindow.

  25                     OTPVerificationLog         Logs OTP verification attempts for audit and
                                                    rate limiting.

  26                     OperationTask              Internal task assigned to Operations Staff
                                                    (status, priority, assignee).

  27                     SupportTicket              Support request created by users and handled by
                                                    Operations Staff.

  28                     Job                        Service job between Customer and Collaborator
                                                    (jobType, requirements, status).

  29                     JobDeliverable             Deliverables submitted by collaborator for a job
                                                    (URLs, note).

  30                     EarningStatement           Mock earnings statement for Host/Collaborator
                                                    (period, totals, breakdown).

  31                     PayoutRequest              Mock payout request for Host/Collaborator
                                                    (amount, status).

  32                     HostContent                Promotional content/webinar announcement created
                                                    by Host.

  33                     AdminActivityLog           Audit log for admin operations (role
                                                    assignments, locks, config changes, exports).

  34                     ExportRequest              Tracks CSV export requests (type, filters,
                                                    requestedBy, generatedAt).

  35                     PaymentTransaction         MoMo sandbox transaction attempts for plan/boost
                         (optional)                 demo (no real settlement).
  --------------------------------------------------------------------------------------------------

## 2. Use Case Specification

### 2.1 Authentication

#### 2.1.1 Register phone number

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | All             | **Secondary      | OTP/SMS Sandbox |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a user, I want to register my phone number so     |
|                    | that I can create an account for future OTP login.   |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • User is on registration screen.                    |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Account is created and linked to phone number;     |
|                    | user can proceed to login.                           |
+--------------------+------------------------------------------------------+
| **Normal           | 1\. User enters phone number and taps \'Register\'.  |
| Sequence/Flow**    |                                                      |
|                    | 2\. System validates phone format and checks         |
|                    | duplicates.                                          |
|                    |                                                      |
|                    | 3\. System creates account with default role         |
|                    | (Customer) and status Active.                        |
|                    |                                                      |
|                    | 4\. System confirms registration success.            |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_Invalid phone format                              |
| Sequences/Flows**  |                                                      |
|                    | 1\. System shows validation error and asks user to   |
|                    | correct the phone number.                            |
|                    |                                                      |
|                    | A2_Phone already registered                          |
|                    |                                                      |
|                    | 1\. System shows \'Phone number already exists\' and |
|                    | suggests logging in instead.                         |
+====================+=================+==================+=================+

### 

#### 2.1.2 Login

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | All             | **Secondary      | OTP/SMS Sandbox |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a user, I want to log in using OTP so that I can  |
|                    | access the system securely.                          |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • User has a registered phone number.                |
+--------------------+------------------------------------------------------+
| **Postconditions** | • User is authenticated and redirected to home       |
|                    | screen.                                              |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. User enters phone number and requests OTP.       |
| Sequence/Flow**    |                                                      |
|                    | 2\. System sends OTP via sandbox and shows OTP input |
|                    | screen.                                              |
|                    |                                                      |
|                    | 3\. User enters OTP and submits.                     |
|                    |                                                      |
|                    | 4\. System verifies OTP and creates a session/token. |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_Invalid OTP                                       |
| Sequences/Flows**  |                                                      |
|                    | 1\. System rejects OTP and allows retry within       |
|                    | limit.                                               |
|                    |                                                      |
|                    | A2_OTP expired                                       |
|                    |                                                      |
|                    | 1\. System asks user to request a new OTP.           |
+====================+=================+==================+=================+

### 

#### 2.1.3 Logout

+--------------------+-----------------+-----------------+-----------------+
| **Primary Actors** | Authenticated   | **Secondary     | None            |
|                    | Users           | Actors**        |                 |
+--------------------+-----------------+-----------------+-----------------+
| **Description**    | As a user, I want to log out so that my session is  |
|                    | closed on this device.                              |
+--------------------+-----------------------------------------------------+
| **Preconditions**  | • User is logged in.                                |
+--------------------+-----------------------------------------------------+
| **Postconditions** | • User session is terminated and user returns to    |
|                    | login screen.                                       |
+--------------------+-----------------------------------------------------+
| **Normal\          | 1\. User taps \'Logout\'.                           |
| Sequence/Flow**    |                                                     |
|                    | 2\. System clears session/token.                    |
|                    |                                                     |
|                    | 3\. System redirects user to login screen.          |
+--------------------+-----------------------------------------------------+
| **Alternative\     | A1_Session already expired                          |
| Sequences/Flows**  |                                                     |
|                    | 1\. System redirects user to login screen and asks  |
|                    | to login again.                                     |
+====================+=================+=================+=================+

### 

### 2.2 Profile Management

#### 2.2.1 View profile

+--------------------+-----------------+-----------------+-----------------+
| **Primary Actors** | Authenticated   | **Secondary     | None            |
|                    | Users           | Actors**        |                 |
+--------------------+-----------------+-----------------+-----------------+
| **Description**    | As a user, I want to view my profile so that I can  |
|                    | see my current account information and role.        |
+--------------------+-----------------------------------------------------+
| **Preconditions**  | • User is logged in.                                |
+--------------------+-----------------------------------------------------+
| **Postconditions** | • Profile information is displayed.                 |
+--------------------+-----------------------------------------------------+
| **Normal\          | 1\. User opens Profile screen.                      |
| Sequence/Flow**    |                                                     |
|                    | 2\. System loads profile details (name, phone,      |
|                    | role, bio).                                         |
|                    |                                                     |
|                    | 3\. System displays profile details.                |
+--------------------+-----------------------------------------------------+
| **Alternative\     | A1_Profile not found                                |
| Sequences/Flows**  |                                                     |
|                    | 1\. System shows error and suggests re-login or     |
|                    | contact support.                                    |
+====================+=================+=================+=================+

### 

#### 2.2.2 Edit profile

+--------------------+-----------------+-----------------+-----------------+
| **Primary Actors** | Authenticated   | **Secondary     | None            |
|                    | Users           | Actors**        |                 |
+--------------------+-----------------+-----------------+-----------------+
| **Description**    | As a user, I want to edit my profile so that my     |
|                    | contact information is up to date.                  |
+--------------------+-----------------------------------------------------+
| **Preconditions**  | • User is logged in.                                |
+--------------------+-----------------------------------------------------+
| **Postconditions** | • Profile updates are saved.                        |
+--------------------+-----------------------------------------------------+
| **Normal\          | 1\. User opens Edit Profile.                        |
| Sequence/Flow**    |                                                     |
|                    | 2\. User updates editable fields (name, location,   |
|                    | bio).                                               |
|                    |                                                     |
|                    | 3\. System validates inputs.                        |
|                    |                                                     |
|                    | 4\. System saves changes and confirms success.      |
+--------------------+-----------------------------------------------------+
| **Alternative\     | A1_Invalid input                                    |
| Sequences/Flows**  |                                                     |
|                    | 1\. System highlights invalid fields and asks user  |
|                    | to correct and resubmit.                            |
+====================+=================+=================+=================+

### 

###  

### 2.3 Shop Management

#### 2.3.1 Create shop

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Customer        | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a customer, I want to create a shop profile so    |
|                    | that I can sell and manage my listings.              |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • User is authenticated as Customer.                 |
|                    |                                                      |
|                    | • User has not created a shop yet.                   |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Shop profile is created and visible to other       |
|                    | users.                                               |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. User opens Create Shop.                          |
| Sequence/Flow**    |                                                      |
|                    | 2\. User enters shop details (name, phone, location, |
|                    | description).                                        |
|                    |                                                      |
|                    | 3\. System validates required fields.                |
|                    |                                                      |
|                    | 4\. System saves shop profile and confirms success.  |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_Missing required fields                           |
| Sequences/Flows**  |                                                      |
|                    | 1\. System prompts user to complete required shop    |
|                    | fields.                                              |
|                    |                                                      |
|                    | A2_Shop already exists                               |
|                    |                                                      |
|                    | 1\. System redirects user to Edit Shop screen.       |
+====================+=================+==================+=================+

### 

#### 2.3.2 View shop details

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | All             | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a user, I want to view a shop so that I can see   |
|                    | its information and published listings.              |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Shop exists.                                       |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Shop details and listings are displayed.           |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. User opens a shop from search/feed.              |
| Sequence/Flow**    |                                                      |
|                    | 2\. System loads shop profile and published          |
|                    | listings.                                            |
|                    |                                                      |
|                    | 3\. System displays shop details and listing grid.   |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_Shop not found/disabled                           |
| Sequences/Flows**  |                                                      |
|                    | 1\. System shows message that the shop is            |
|                    | unavailable.                                         |
+====================+=================+==================+=================+

### 

#### 2.3.3 Edit shop

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Customer        | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a customer, I want to edit my shop so that my     |
|                    | shop information and images stay accurate.           |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • User is authenticated as Customer.                 |
|                    |                                                      |
|                    | • User owns the shop.                                |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Shop information is updated.                       |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. User opens Edit Shop.                            |
| Sequence/Flow**    |                                                      |
|                    | 2\. User updates shop fields and images.             |
|                    |                                                      |
|                    | 3\. System validates inputs.                         |
|                    |                                                      |
|                    | 4\. System saves changes and confirms success.       |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_Invalid input                                     |
| Sequences/Flows**  |                                                      |
|                    | 1\. System highlights invalid fields and asks user   |
|                    | to fix.                                              |
+====================+=================+==================+=================+

### 

#### 2.3.4 Manage shop status

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Customer        | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a customer, I want to close or reopen my shop so  |
|                    | that I can pause selling when needed.                |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • User is authenticated as Customer.                 |
|                    |                                                      |
|                    | • User owns the shop.                                |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Shop status is updated (Open/Closed) and reflected |
|                    | to viewers.                                          |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. User opens Shop Settings.                        |
| Sequence/Flow**    |                                                      |
|                    | 2\. User toggles status to Close/Reopen.             |
|                    |                                                      |
|                    | 3\. System updates status and confirms.              |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_Shop has policy restriction                       |
| Sequences/Flows**  |                                                      |
|                    | 1\. System blocks action and shows the reason (e.g., |
|                    | shop locked).                                        |
+====================+=================+==================+=================+

### 

#### 2.3.5 Search shops

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | All             | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a user, I want to search shops so that I can find |
|                    | sellers by keyword or location.                      |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • System has shop data.                              |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Search results are displayed.                      |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. User enters keyword/location in search box.      |
| Sequence/Flow**    |                                                      |
|                    | 2\. System returns matching shops.                   |
|                    |                                                      |
|                    | 3\. User opens a shop from results.                  |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_No results                                        |
| Sequences/Flows**  |                                                      |
|                    | 1\. System shows \'No shops found\' and suggests     |
|                    | changing keywords.                                   |
+====================+=================+==================+=================+

### 

#### 2.3.6 View shop statistics 

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Customer        | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a customer, I want to view shop statistics so     |
|                    | that I can understand my shop performance.           |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • User is authenticated as Customer.                 |
|                    |                                                      |
|                    | • User owns the shop.                                |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Shop metrics are displayed (views, top posts,      |
|                    | trends).                                             |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. User opens Shop Statistics.                      |
| Sequence/Flow**    |                                                      |
|                    | 2\. System aggregates shop metrics for selected      |
|                    | period.                                              |
|                    |                                                      |
|                    | 3\. System displays charts/summary.                  |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_No data                                           |
| Sequences/Flows**  |                                                      |
|                    | 1\. System shows empty state and guidance to publish |
|                    | listings.                                            |
+====================+=================+==================+=================+

### 

###  

### 2.4 Post Management

#### 2.4.1 View news feed

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | All             | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a user, I want to browse the news feed so that I  |
|                    | can discover latest listings.                        |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • System has published posts.                        |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Feed posts are displayed.                          |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. User opens Home/Feed.                            |
| Sequence/Flow**    |                                                      |
|                    | 2\. System loads posts for ranking (boost + normal). |
|                    |                                                      |
|                    | 3\. System displays feed with pagination.            |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_No posts                                          |
| Sequences/Flows**  |                                                      |
|                    | 1\. System shows empty feed and suggested actions.   |
+====================+=================+==================+=================+

### 

#### 2.4.2 Search, filter and sort posts

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | All             | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a user, I want to search and filter posts so that |
|                    | I can find listings that match my needs.             |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • System has searchable post data.                   |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Filtered/sorted results are displayed.             |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. User enters keywords or selects filters.         |
| Sequence/Flow**    |                                                      |
|                    | 2\. System applies filters/sort.                     |
|                    |                                                      |
|                    | 3\. System displays results with pagination.         |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_No results                                        |
| Sequences/Flows**  |                                                      |
|                    | 1\. System shows \'No posts found\' and suggests     |
|                    | relaxing filters.                                    |
+====================+=================+==================+=================+

### 

#### 2.4.3 View post details

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | All             | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a user, I want to view post details so that I can |
|                    | see full information before contacting seller.       |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Post exists and is visible.                        |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Post detail page is displayed.                     |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. User opens a post from feed/search.              |
| Sequence/Flow**    |                                                      |
|                    | 2\. System loads post details.                       |
|                    |                                                      |
|                    | 3\. System displays post detail page.                |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_Post removed/hidden                               |
| Sequences/Flows**  |                                                      |
|                    | 1\. System shows message that the post is            |
|                    | unavailable.                                         |
+====================+=================+==================+=================+

### 

#### 2.4.4 Share post

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | All             | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a user, I want to share a post so that I can send |
|                    | the listing link to others.                          |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Post is visible.                                   |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Share action is completed or share dialog is       |
|                    | opened.                                              |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. User taps Share on post.                         |
| Sequence/Flow**    |                                                      |
|                    | 2\. System generates shareable link.                 |
|                    |                                                      |
|                    | 3\. System opens native share options.               |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_Link generation failed                            |
| Sequences/Flows**  |                                                      |
|                    | 1\. System shows error and allows retry.             |
+====================+=================+==================+=================+

### 

#### 2.4.5 View my posts

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Customer        | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a customer, I want to view my posts so that I can |
|                    | manage my listings.                                  |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • User is authenticated as Customer.                 |
+--------------------+------------------------------------------------------+
| **Postconditions** | • User's post list is displayed.                     |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. User opens My Posts.                             |
| Sequence/Flow**    |                                                      |
|                    | 2\. System loads user\'s posts by status.            |
|                    |                                                      |
|                    | 3\. System displays list with filters.               |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_No posts                                          |
| Sequences/Flows**  |                                                      |
|                    | 1\. System shows empty state and \'Create post\'     |
|                    | CTA.                                                 |
+====================+=================+==================+=================+

### 

#### 2.4.6 Create post

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Customer        | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a customer, I want to create a new post so that I |
|                    | can publish a listing.                               |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • User is authenticated as Customer.                 |
|                    |                                                      |
|                    | • User has a shop profile.                           |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Post is created (draft/pending) and saved.         |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. User opens Create Post form.                     |
| Sequence/Flow**    |                                                      |
|                    | 2\. User enters post info and images.                |
|                    |                                                      |
|                    | 3\. System validates required fields.                |
|                    |                                                      |
|                    | 4\. System saves post or submits for moderation.     |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_Missing required fields                           |
| Sequences/Flows**  |                                                      |
|                    | 1\. System highlights missing fields and blocks      |
|                    | submit.                                              |
|                    |                                                      |
|                    | A2_Image upload failed                               |
|                    |                                                      |
|                    | 1\. System shows error and allows retry/remove       |
|                    | image.                                               |
+====================+=================+==================+=================+

### 

#### 2.4.7 Edit post

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Customer        | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a customer, I want to edit my post so that the    |
|                    | listing information stays accurate.                  |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • User is authenticated as Customer.                 |
|                    |                                                      |
|                    | • User owns the post.                                |
|                    |                                                      |
|                    | • Post is editable (not locked).                     |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Post information is updated.                       |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. User opens Edit Post.                            |
| Sequence/Flow**    |                                                      |
|                    | 2\. User changes fields.                             |
|                    |                                                      |
|                    | 3\. System validates changes.                        |
|                    |                                                      |
|                    | 4\. System saves updates and confirms.               |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_Post locked by moderation                         |
| Sequences/Flows**  |                                                      |
|                    | 1\. System blocks edits and shows reason/status.     |
+====================+=================+==================+=================+

### 

#### 2.4.8 Move post to trash

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Customer        | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a customer, I want to move a post to trash so     |
|                    | that I can hide it without deleting permanently.     |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • User is authenticated as Customer.                 |
|                    |                                                      |
|                    | • User owns the post.                                |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Post status becomes Trashed and is hidden from     |
|                    | public.                                              |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. User taps \'Move to trash\'.                     |
| Sequence/Flow**    |                                                      |
|                    | 2\. System confirms action.                          |
|                    |                                                      |
|                    | 3\. System updates post status to Trashed.           |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_User cancels                                      |
| Sequences/Flows**  |                                                      |
|                    | 1\. System keeps the post unchanged.                 |
+====================+=================+==================+=================+

### 

#### 2.4.9 Restore post from trash

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Customer        | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a customer, I want to restore a trashed post so   |
|                    | that it can be visible again.                        |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • User is authenticated as Customer.                 |
|                    |                                                      |
|                    | • Post is in trash and within restore window.        |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Post is restored to previous status.               |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. User opens Trash list.                           |
| Sequence/Flow**    |                                                      |
|                    | 2\. User taps Restore.                               |
|                    |                                                      |
|                    | 3\. System restores post and confirms.               |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_Restore window expired                            |
| Sequences/Flows**  |                                                      |
|                    | 1\. System blocks restore and suggests permanent     |
|                    | delete.                                              |
+====================+=================+==================+=================+

### 

#### 2.4.10 Permanently delete post

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Customer        | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a customer, I want to permanently delete a post   |
|                    | so that it is removed from the system.               |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • User is authenticated as Customer.                 |
|                    |                                                      |
|                    | • Post is in trash or eligible for delete.           |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Post is permanently removed and cannot be          |
|                    | restored.                                            |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. User taps Delete permanently.                    |
| Sequence/Flow**    |                                                      |
|                    | 2\. System asks for confirmation.                    |
|                    |                                                      |
|                    | 3\. System deletes post and confirms.                |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_User cancels                                      |
| Sequences/Flows**  |                                                      |
|                    | 1\. System keeps the post in trash.                  |
+====================+=================+==================+=================+

### 

#### 2.4.11 Submit post for moderation

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Customer        | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a customer, I want to submit my post for approval |
|                    | so that it can be published to the marketplace.      |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • User is authenticated as Customer.                 |
|                    |                                                      |
|                    | • Post draft is complete.                            |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Post status becomes Pending and appears in         |
|                    | moderation queue.                                    |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. User taps Submit for moderation.                 |
| Sequence/Flow**    |                                                      |
|                    | 2\. System validates post content.                   |
|                    |                                                      |
|                    | 3\. System sets status to Pending and notifies user. |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_Validation failed                                 |
| Sequences/Flows**  |                                                      |
|                    | 1\. System shows missing/invalid fields and blocks   |
|                    | submit.                                              |
+====================+=================+==================+=================+

### 

#### 2.4.12 View rejection reason

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Customer        | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a customer, I want to view the rejection reason   |
|                    | so that I can fix and resubmit my post.              |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • User is authenticated as Customer.                 |
|                    |                                                      |
|                    | • Post is rejected.                                  |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Rejection reason is displayed.                     |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. User opens rejected post detail.                 |
| Sequence/Flow**    |                                                      |
|                    | 2\. System shows rejection reason.                   |
|                    |                                                      |
|                    | 3\. User navigates to Edit Post to fix issues.       |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_No reason available                               |
| Sequences/Flows**  |                                                      |
|                    | 1\. System shows generic message and suggests        |
|                    | contacting support.                                  |
+====================+=================+==================+=================+

#### 

#### 2.4.13 Manage post images

+--------------------+------------------+------------------+------------------+
| **Primary Actors** | Customer         | **Secondary      | None             |
|                    |                  | Actors**         |                  |
+--------------------+------------------+------------------+------------------+
| **Description**    | As a customer, I want to manage post images so that I  |
|                    | can upload, remove, and reorder them.                  |
+--------------------+--------------------------------------------------------+
| **Preconditions**  | • User is authenticated as Customer.                   |
|                    |                                                        |
|                    | • User owns the post.                                  |
+--------------------+--------------------------------------------------------+
| **Postconditions** | • Images are updated and saved.                        |
+--------------------+--------------------------------------------------------+
| **Normal\          | 1\. User uploads/removes/reorders images.              |
| Sequence/Flow**    |                                                        |
|                    | 2\. System validates image count/size.                 |
|                    |                                                        |
|                    | 3\. System saves image changes.                        |
+--------------------+--------------------------------------------------------+
| **Alternative\     | A1_Too many images                                     |
| Sequences/Flows**  |                                                        |
|                    | 1\. System blocks upload and shows max image limit.    |
|                    |                                                        |
|                    | A2_Invalid image format                                |
|                    |                                                        |
|                    | 1\. System rejects file and shows supported formats.   |
+====================+==================+==================+==================+

### 

###  

### 2.5 Favorite Management

#### 2.5.1 Add post to favorites

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Customer        | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a customer, I want to add a post to favorites so  |
|                    | that I can revisit it later.                         |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • User is authenticated as Customer.                 |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Post is added to favorites list.                   |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. User taps Favorite on a post.                    |
| Sequence/Flow**    |                                                      |
|                    | 2\. System saves favorite record.                    |
|                    |                                                      |
|                    | 3\. System shows confirmation.                       |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_Already favorited                                 |
| Sequences/Flows**  |                                                      |
|                    | 1\. System shows \'Already in favorites\'.           |
+====================+=================+==================+=================+

### 

#### 2.5.2 Remove post from favorites

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Customer        | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a customer, I want to remove a post from          |
|                    | favorites so that my list stays relevant.            |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • User is authenticated as Customer.                 |
|                    |                                                      |
|                    | • Post is in favorites.                              |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Favorite record is removed.                        |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. User opens Favorites list.                       |
| Sequence/Flow**    |                                                      |
|                    | 2\. User taps Remove.                                |
|                    |                                                      |
|                    | 3\. System removes favorite and updates list.        |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_Not found                                         |
| Sequences/Flows**  |                                                      |
|                    | 1\. System refreshes list and shows item was already |
|                    | removed.                                             |
+====================+=================+==================+=================+

### 

#### 2.5.3 View favorite posts

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Customer        | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a customer, I want to view my favorite posts so   |
|                    | that I can compare saved listings.                   |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • User is authenticated as Customer.                 |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Favorites list is displayed.                       |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. User opens Favorites.                            |
| Sequence/Flow**    |                                                      |
|                    | 2\. System loads favorited posts.                    |
|                    |                                                      |
|                    | 3\. System displays list with pagination.            |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_No favorites                                      |
| Sequences/Flows**  |                                                      |
|                    | 1\. System shows empty state.                        |
+====================+=================+==================+=================+

### 

#### 2.5.4 Clear favorite list

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Customer        | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a customer, I want to clear my favorites so that  |
|                    | I can start a new shortlist.                         |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • User is authenticated as Customer.                 |
+--------------------+------------------------------------------------------+
| **Postconditions** | • All favorites are removed.                         |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. User taps Clear all.                             |
| Sequence/Flow**    |                                                      |
|                    | 2\. System asks for confirmation.                    |
|                    |                                                      |
|                    | 3\. System clears favorites and updates UI.          |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_User cancels                                      |
| Sequences/Flows**  |                                                      |
|                    | 1\. System keeps favorites unchanged.                |
+====================+=================+==================+=================+

### 

###  

### 2.6 Reports Management

#### 2.6.1 Create report

+--------------------+------------------+------------------+------------------+
| **Primary Actors** | Guest/Customer   | **Secondary      | None             |
|                    |                  | Actors**         |                  |
+--------------------+------------------+------------------+------------------+
| **Description**    | As a user, I want to report a post or shop so that I   |
|                    | can flag inappropriate content.                        |
+--------------------+--------------------------------------------------------+
| **Preconditions**  | • Target post/shop exists and is visible.              |
+--------------------+--------------------------------------------------------+
| **Postconditions** | • Report is created with status Pending.               |
+--------------------+--------------------------------------------------------+
| **Normal\          | 1\. User taps Report.                                  |
| Sequence/Flow**    |                                                        |
|                    | 2\. User selects reason and optional description.      |
|                    |                                                        |
|                    | 3\. System creates report.                             |
|                    |                                                        |
|                    | 4\. System confirms submission.                        |
+--------------------+--------------------------------------------------------+
| **Alternative\     | A1_Missing reason                                      |
| Sequences/Flows**  |                                                        |
|                    | 1\. System asks user to select a reason.               |
+====================+==================+==================+==================+

### 

#### 2.6.2 Attach report evidence

+--------------------+------------------+------------------+------------------+
| **Primary Actors** | Guest/Customer   | **Secondary      | None             |
|                    |                  | Actors**         |                  |
+--------------------+------------------+------------------+------------------+
| **Description**    | As a user, I want to attach evidence so that my report |
|                    | is clearer for reviewers.                              |
+--------------------+--------------------------------------------------------+
| **Preconditions**  | • User is creating a report.                           |
+--------------------+--------------------------------------------------------+
| **Postconditions** | • Evidence file(s) are attached.                       |
+--------------------+--------------------------------------------------------+
| **Normal\          | 1\. User selects Add Evidence.                         |
| Sequence/Flow**    |                                                        |
|                    | 2\. User uploads file.                                 |
|                    |                                                        |
|                    | 3\. System validates size/type.                        |
|                    |                                                        |
|                    | 4\. System attaches evidence.                          |
+--------------------+--------------------------------------------------------+
| **Alternative\     | A1_Invalid file                                        |
| Sequences/Flows**  |                                                        |
|                    | 1\. System rejects file and shows accepted             |
|                    | formats/size limit.                                    |
+====================+==================+==================+==================+

### 

#### 2.6.3 View my reports

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Customer        | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a customer, I want to view my submitted reports   |
|                    | so that I can track their processing status.         |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • User is authenticated as Customer.                 |
+--------------------+------------------------------------------------------+
| **Postconditions** | • User report list is displayed.                     |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. User opens My Reports.                           |
| Sequence/Flow**    |                                                      |
|                    | 2\. System loads reports created by user.            |
|                    |                                                      |
|                    | 3\. System displays status and submitted time.       |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_No reports                                        |
| Sequences/Flows**  |                                                      |
|                    | 1\. System shows empty state.                        |
+====================+=================+==================+=================+

### 

#### 2.6.4 Cancel report

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Customer        | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a customer, I want to cancel a report so that I   |
|                    | can retract it before processing.                    |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • User is authenticated as Customer.                 |
|                    |                                                      |
|                    | • Report is Pending and created by user.             |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Report status becomes Cancelled.                   |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. User opens a pending report.                     |
| Sequence/Flow**    |                                                      |
|                    | 2\. User taps Cancel.                                |
|                    |                                                      |
|                    | 3\. System updates status and confirms.              |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_Report already processed                          |
| Sequences/Flows**  |                                                      |
|                    | 1\. System blocks cancel and shows current status.   |
+====================+=================+==================+=================+

### 

#### 2.6.5 View report result

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Customer        | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a customer, I want to view the report result so   |
|                    | that I know the final handling outcome.              |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • User is authenticated as Customer.                 |
|                    |                                                      |
|                    | • Report is processed.                               |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Report resolution is displayed.                    |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. User opens report details.                       |
| Sequence/Flow**    |                                                      |
|                    | 2\. System shows resolution and moderator note.      |
|                    |                                                      |
|                    | 3\. User can close the report.                       |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_Result not available                              |
| Sequences/Flows**  |                                                      |
|                    | 1\. System shows processing state and suggests       |
|                    | checking later.                                      |
+====================+=================+==================+=================+

### 

###  

### 2.7 Moderation Management

#### 2.7.1 Block shop

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Manager         | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a manager, I want to block a shop so that it      |
|                    | cannot publish or be viewed due to violations.       |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Manager is authenticated.                          |
|                    |                                                      |
|                    | • Shop exists and is not blocked.                    |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Shop becomes Blocked; related posts are hidden;    |
|                    | action is logged.                                    |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. Manager opens shop action.                       |
| Sequence/Flow**    |                                                      |
|                    | 2\. Manager selects Block and provides reason.       |
|                    |                                                      |
|                    | 3\. System blocks shop and hides posts.              |
|                    |                                                      |
|                    | 4\. System notifies shop owner.                      |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_Insufficient permission                           |
| Sequences/Flows**  |                                                      |
|                    | 1\. System denies action.                            |
+====================+=================+==================+=================+

### 

#### 2.7.2 Unblock shop

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Manager         | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a manager, I want to unblock a shop so that it    |
|                    | can operate again after review.                      |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Manager is authenticated.                          |
|                    |                                                      |
|                    | • Shop is blocked.                                   |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Shop becomes Active; action is logged.             |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. Manager opens blocked shop.                      |
| Sequence/Flow**    |                                                      |
|                    | 2\. Manager selects Unblock.                         |
|                    |                                                      |
|                    | 3\. System updates status and logs action.           |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_Policy restriction                                |
| Sequences/Flows**  |                                                      |
|                    | 1\. System blocks unblock and shows required         |
|                    | conditions.                                          |
+====================+=================+==================+=================+

### 

###  

#### 2.7.3 View moderation queue

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Manager         | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a manager, I want to view the moderation queue so |
|                    | that I can review pending or reported posts.         |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Manager is authenticated.                          |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Queue list is displayed.                           |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. Manager opens Moderation Queue.                  |
| Sequence/Flow**    |                                                      |
|                    | 2\. System loads pending and reported items.         |
|                    |                                                      |
|                    | 3\. Manager filters/sorts queue.                     |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_No items                                          |
| Sequences/Flows**  |                                                      |
|                    | 1\. System shows empty queue.                        |
+====================+=================+==================+=================+

### 

####  2.7.4 Moderate post 

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Manager         | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a manager, I want to approve/reject/hide a post   |
|                    | so that marketplace content stays high quality.      |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Manager is authenticated.                          |
|                    |                                                      |
|                    | • Post is Pending/Reported.                          |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Post status is updated; action is logged; owner is |
|                    | notified.                                            |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. Manager opens post from queue.                   |
| Sequence/Flow**    |                                                      |
|                    | 2\. Manager reviews content.                         |
|                    |                                                      |
|                    | 3\. Manager selects action and note.                 |
|                    |                                                      |
|                    | 4\. System updates status and notifies owner.        |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_Already processed                                 |
| Sequences/Flows**  |                                                      |
|                    | 1\. System refreshes state and prevents duplicate    |
|                    | action.                                              |
+====================+=================+==================+=================+

### 

#### 2.7.5 Resolve report

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Manager         | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a manager, I want to resolve a report so that     |
|                    | reported content is handled and closed.              |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Manager is authenticated.                          |
|                    |                                                      |
|                    | • Report is Pending.                                 |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Report becomes Resolved with outcome recorded.     |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. Manager opens report.                            |
| Sequence/Flow**    |                                                      |
|                    | 2\. Manager reviews evidence.                        |
|                    |                                                      |
|                    | 3\. Manager chooses outcome and actions.             |
|                    |                                                      |
|                    | 4\. System closes report and logs decision.          |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_Report closed                                     |
| Sequences/Flows**  |                                                      |
|                    | 1\. System shows current status and prevents action. |
+====================+=================+==================+=================+

### 

#### 2.7.6 Send moderation feedback 

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Manager         | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a manager, I want to send feedback so that the    |
|                    | post owner understands what to fix.                  |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Manager is authenticated.                          |
|                    |                                                      |
|                    | • A moderation action exists.                        |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Feedback is sent and stored in history.            |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. Manager selects template or writes note.         |
| Sequence/Flow**    |                                                      |
|                    | 2\. System sends notification.                       |
|                    |                                                      |
|                    | 3\. System stores feedback with action log.          |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_Send failed                                       |
| Sequences/Flows**  |                                                      |
|                    | 1\. System retries or queues notification.           |
+====================+=================+==================+=================+

### 

####  

#### 2.7.7 View moderation history

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Manager         | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a manager, I want to view moderation history so   |
|                    | that I can audit past actions.                       |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Manager is authenticated.                          |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Moderation history is displayed.                   |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. Manager opens history.                           |
| Sequence/Flow**    |                                                      |
|                    | 2\. System loads actions with filters.               |
|                    |                                                      |
|                    | 3\. Manager views action detail.                     |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_No history                                        |
| Sequences/Flows**  |                                                      |
|                    | 1\. System shows empty state.                        |
+====================+=================+==================+=================+

### 

#### 2.7.8 View moderation statistics

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Manager         | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a manager, I want to view moderation statistics   |
|                    | so that I can monitor workload and trends.           |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Manager is authenticated.                          |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Stats summary is displayed.                        |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. Manager opens statistics.                        |
| Sequence/Flow**    |                                                      |
|                    | 2\. System aggregates metrics.                       |
|                    |                                                      |
|                    | 3\. System displays charts/summary.                  |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_No data                                           |
| Sequences/Flows**  |                                                      |
|                    | 1\. System shows empty state.                        |
+====================+=================+==================+=================+

### 

#### 2.7.9 Escalate violation

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Manager         | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a manager, I want to escalate serious violations  |
|                    | to admin so that higher-level action can be taken.   |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Manager is authenticated.                          |
|                    |                                                      |
|                    | • Violation is severe.                               |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Escalation ticket is created and admin is          |
|                    | notified.                                            |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. Manager selects Escalate.                        |
| Sequence/Flow**    |                                                      |
|                    | 2\. Manager adds note/severity.                      |
|                    |                                                      |
|                    | 3\. System creates escalation ticket.                |
|                    |                                                      |
|                    | 4\. System notifies admin.                           |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_Admin unreachable                                 |
| Sequences/Flows**  |                                                      |
|                    | 1\. System queues escalation and confirms.           |
+====================+=================+==================+=================+

### 

###  

### 2.8 Operations Staff Management

#### 2.8.1 View assigned tasks

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Operations      | **Secondary      | None            |
|                    | Staff           | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As operations staff, I want to view my assigned      |
|                    | tasks so that I can handle work.                     |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Staff is authenticated.                            |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Assigned tasks are displayed.                      |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. Staff opens Assigned Tasks.                      |
| Sequence/Flow**    |                                                      |
|                    | 2\. System loads tasks.                              |
|                    |                                                      |
|                    | 3\. Staff views details/priority.                    |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_No tasks                                          |
| Sequences/Flows**  |                                                      |
|                    | 1\. System shows empty state.                        |
+====================+=================+==================+=================+

### 

#### 2.8.2 Handle customer support requests

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Operations      | **Secondary      | None            |
|                    | Staff           | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As operations staff, I want to handle support        |
|                    | tickets so that user issues are resolved.            |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Staff is authenticated.                            |
|                    |                                                      |
|                    | • Ticket exists.                                     |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Ticket is updated with resolution note.            |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. Staff opens ticket.                              |
| Sequence/Flow**    |                                                      |
|                    | 2\. Staff reviews info.                              |
|                    |                                                      |
|                    | 3\. Staff updates status and resolution.             |
|                    |                                                      |
|                    | 4\. System logs update.                              |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_Ticket closed                                     |
| Sequences/Flows**  |                                                      |
|                    | 1\. System prevents changes and shows status.        |
+====================+=================+==================+=================+

### 

#### 2.8.3 Update task status

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Operations      | **Secondary      | None            |
|                    | Staff           | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As operations staff, I want to update task status so |
|                    | that progress is tracked.                            |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Staff is authenticated.                            |
|                    |                                                      |
|                    | • Task is assigned.                                  |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Task status is updated.                            |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. Staff opens task.                                |
| Sequence/Flow**    |                                                      |
|                    | 2\. Staff updates status and note.                   |
|                    |                                                      |
|                    | 3\. System saves and logs timestamp.                 |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_Invalid transition                                |
| Sequences/Flows**  |                                                      |
|                    | 1\. System blocks and shows allowed statuses.        |
+====================+=================+==================+=================+

### 

#### 2.8.4 View daily operation workload

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Operations      | **Secondary      | None            |
|                    | Staff           | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As operations staff, I want to view daily workload   |
|                    | so that I can plan work.                             |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Staff is authenticated.                            |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Workload summary is displayed.                     |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. Staff opens Daily Workload.                      |
| Sequence/Flow**    |                                                      |
|                    | 2\. System aggregates tasks by status/due.           |
|                    |                                                      |
|                    | 3\. System displays summary.                         |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_No data                                           |
| Sequences/Flows**  |                                                      |
|                    | 1\. System shows empty state.                        |
+====================+=================+==================+=================+

### 

#### 2.8.5 View system notifications

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Operations      | **Secondary      | None            |
|                    | Staff           | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As operations staff, I want to view system           |
|                    | notifications so that I can respond to events.       |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Staff is authenticated.                            |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Notifications are displayed.                       |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. Staff opens Notifications.                       |
| Sequence/Flow**    |                                                      |
|                    | 2\. System loads notifications.                      |
|                    |                                                      |
|                    | 3\. Staff opens notification detail.                 |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_No notifications                                  |
| Sequences/Flows**  |                                                      |
|                    | 1\. System shows empty state.                        |
+====================+=================+==================+=================+

### 

###  

### 2.9 Collaborator Management

#### 2.9.1 View available jobs

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Collaborator    | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a collaborator, I want to view available jobs so  |
|                    | that I can accept suitable requests.                 |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Collaborator is authenticated.                     |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Available jobs list is displayed.                  |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. Collaborator opens Jobs board.                   |
| Sequence/Flow**    |                                                      |
|                    | 2\. System lists jobs with filters.                  |
|                    |                                                      |
|                    | 3\. Collaborator opens job detail.                   |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_No jobs                                           |
| Sequences/Flows**  |                                                      |
|                    | 1\. System shows empty state.                        |
+====================+=================+==================+=================+

### 

###  

#### 2.9.2 Accept or decline job

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Collaborator    | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a collaborator, I want to accept/decline a job so |
|                    | that I can manage workload.                          |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Collaborator is authenticated.                     |
|                    |                                                      |
|                    | • Job is open.                                       |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Job status is updated and requester is notified.   |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. Collaborator opens job.                          |
| Sequence/Flow**    |                                                      |
|                    | 2\. Collaborator selects Accept/Decline.             |
|                    |                                                      |
|                    | 3\. System updates status.                           |
|                    |                                                      |
|                    | 4\. System notifies requester.                       |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_Job already taken                                 |
| Sequences/Flows**  |                                                      |
|                    | 1\. System blocks action and refreshes state.        |
+====================+=================+==================+=================+

### 

###  

#### 2.9.3 View collaborator earnings

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Collaborator    | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a collaborator, I want to view my earnings so     |
|                    | that I can track income (mock).                      |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Collaborator is authenticated.                     |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Earnings summary is displayed.                     |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. Collaborator opens Earnings.                     |
| Sequence/Flow**    |                                                      |
|                    | 2\. System aggregates completed jobs.                |
|                    |                                                      |
|                    | 3\. System displays statement (mock).                |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_No earnings                                       |
| Sequences/Flows**  |                                                      |
|                    | 1\. System shows empty state.                        |
+====================+=================+==================+=================+

### 

#### 2.9.4 Request payout

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Collaborator    | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a collaborator, I want to request payout so that  |
|                    | I can withdraw earnings (mock).                      |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Collaborator is authenticated.                     |
|                    |                                                      |
|                    | • Balance is available.                              |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Payout request is created (mock).                  |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. Collaborator taps Request payout.                |
| Sequence/Flow**    |                                                      |
|                    | 2\. Collaborator enters amount/method (mock).        |
|                    |                                                      |
|                    | 3\. System validates and creates request.            |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_Insufficient balance                              |
| Sequences/Flows**  |                                                      |
|                    | 1\. System blocks request and shows available        |
|                    | balance.                                             |
+====================+=================+==================+=================+

### 

#### 2.9.5 Submit job result 

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Collaborator    | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a collaborator, I want to submit completed work   |
|                    | so that the customer can confirm delivery.           |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Collaborator is authenticated.                     |
|                    |                                                      |
|                    | • Job is accepted.                                   |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Job result is submitted and status updates.        |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. Collaborator opens job.                          |
| Sequence/Flow**    |                                                      |
|                    | 2\. Collaborator uploads result/note.                |
|                    |                                                      |
|                    | 3\. System saves result and updates status.          |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_Upload failed                                     |
| Sequences/Flows**  |                                                      |
|                    | 1\. System shows error and allows retry.             |
+====================+=================+==================+=================+

### 

### 2.10 Host Management

#### 2.10.1 View host dashboard

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Host            | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a host, I want to view my dashboard so that I can |
|                    | track content and earnings (mock).                   |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Host is authenticated.                             |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Dashboard is displayed.                            |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. Host opens dashboard.                            |
| Sequence/Flow**    |                                                      |
|                    | 2\. System loads stats and summary.                  |
|                    |                                                      |
|                    | 3\. System displays widgets.                         |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_No data                                           |
| Sequences/Flows**  |                                                      |
|                    | 1\. System shows empty state.                        |
+====================+=================+==================+=================+

####  

#### 2.10.2 Create promotional content 

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Host            | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a host, I want to create promotional content so   |
|                    | that I can publish information posts.                |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Host is authenticated.                             |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Promotional content is created.                    |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. Host opens Create Content.                       |
| Sequence/Flow**    |                                                      |
|                    | 2\. Host enters content and media.                   |
|                    |                                                      |
|                    | 3\. System validates and saves content.              |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_Invalid content                                   |
| Sequences/Flows**  |                                                      |
|                    | 1\. System highlights missing fields.                |
+====================+=================+==================+=================+

### 

#### 2.10.3 View host earnings

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Host            | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a host, I want to view earnings so that I can     |
|                    | track revenue (mock).                                |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Host is authenticated.                             |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Earnings statement is displayed (mock).            |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. Host opens Earnings.                             |
| Sequence/Flow**    |                                                      |
|                    | 2\. System aggregates transactions (mock).           |
|                    |                                                      |
|                    | 3\. System displays summary.                         |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_No earnings                                       |
| Sequences/Flows**  |                                                      |
|                    | 1\. System shows empty state.                        |
+====================+=================+==================+=================+

### 

#### 2.10.4 Request host payout 

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Host            | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a host, I want to request payout so that I can    |
|                    | withdraw earnings (mock).                            |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Host is authenticated.                             |
|                    |                                                      |
|                    | • Balance is available.                              |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Payout request is created (mock).                  |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. Host requests payout.                            |
| Sequence/Flow**    |                                                      |
|                    | 2\. Host confirms amount.                            |
|                    |                                                      |
|                    | 3\. System validates and creates request.            |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_Insufficient balance                              |
| Sequences/Flows**  |                                                      |
|                    | 1\. System blocks request.                           |
+====================+=================+==================+=================+

### 

###  

### 2.11 Promotion & Placement Management

#### 2.11.1 View promotion packages

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Customer        | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a customer, I want to view promotion packages so  |
|                    | that I can choose a slot to boost visibility.        |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • User is authenticated as Customer.                 |
|                    |                                                      |
|                    | • Packages are configured by Admin.                  |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Package list is displayed.                         |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. User opens Promotions.                           |
| Sequence/Flow**    |                                                      |
|                    | 2\. System shows packages by slot/duration/price.    |
|                    |                                                      |
|                    | 3\. User views package details/rules.                |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_No packages                                       |
| Sequences/Flows**  |                                                      |
|                    | 1\. System shows empty state.                        |
+====================+=================+==================+=================+

### 

#### 2.11.2 Purchase promotion package (sandbox) 

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Customer        | **Secondary      | MoMo Sandbox    |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a customer, I want to purchase a promotion        |
|                    | package so that I can boost my post.                 |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • User is authenticated as Customer.                 |
|                    |                                                      |
|                    | • Package exists.                                    |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Payment status recorded (sandbox) and package      |
|                    | activated if success.                                |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. User selects package and taps Purchase.          |
| Sequence/Flow**    |                                                      |
|                    | 2\. System initiates MoMo sandbox payment.           |
|                    |                                                      |
|                    | 3\. MoMo returns result.                             |
|                    |                                                      |
|                    | 4\. System records transaction and activates         |
|                    | package.                                             |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_Payment failed/cancelled                          |
| Sequences/Flows**  |                                                      |
|                    | 1\. System shows failed status and keeps package     |
|                    | inactive.                                            |
+====================+=================+==================+=================+

### 

####  2.11.3 Assign package to post (boost)

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Customer        | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a customer, I want to assign an active package to |
|                    | a post so that it is boosted in a slot.              |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • User is authenticated as Customer.                 |
|                    |                                                      |
|                    | • User owns post.                                    |
|                    |                                                      |
|                    | • User has active package.                           |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Boost is created with slot and effective time.     |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. User selects post and package.                   |
| Sequence/Flow**    |                                                      |
|                    | 2\. System validates slot capacity/policy.           |
|                    |                                                      |
|                    | 3\. System activates boost.                          |
|                    |                                                      |
|                    | 4\. System confirms.                                 |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_No active package                                 |
| Sequences/Flows**  |                                                      |
|                    | 1\. System asks user to purchase first.              |
|                    |                                                      |
|                    | A2_Slot capacity full                                |
|                    |                                                      |
|                    | 1\. System suggests another slot/time window.        |
+====================+=================+==================+=================+

### 

#### 2.11.4 View boosted post status 

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Customer        | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a customer, I want to view boost status so that I |
|                    | know whether my post is currently boosted.           |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • User is authenticated as Customer.                 |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Boost status list is displayed.                    |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. User opens Boost Status.                         |
| Sequence/Flow**    |                                                      |
|                    | 2\. System loads boosts.                             |
|                    |                                                      |
|                    | 3\. System displays active/expired boosts.           |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_No boosts                                         |
| Sequences/Flows**  |                                                      |
|                    | 1\. System shows empty state.                        |
+====================+=================+==================+=================+

### 

#### 2.11.5 Cancel boost / unassign package

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Customer        | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a customer, I want to cancel a boost so that my   |
|                    | post returns to normal ranking.                      |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • User is authenticated as Customer.                 |
|                    |                                                      |
|                    | • Boost is active and cancellable by policy.         |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Boost is cancelled and slot is released.           |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. User selects boost.                              |
| Sequence/Flow**    |                                                      |
|                    | 2\. User confirms cancel.                            |
|                    |                                                      |
|                    | 3\. System cancels boost and updates ranking.        |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_Cancel not allowed                                |
| Sequences/Flows**  |                                                      |
|                    | 1\. System blocks and shows policy reason.           |
+====================+=================+==================+=================+

### 

###  

###  

#### 2.11.6 View my purchase history

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Customer        | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a customer, I want to view my purchase history so |
|                    | that I can track purchased packages and payment      |
|                    | status.                                              |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • User is authenticated as Customer.                 |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Purchase history is displayed.                     |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. User opens Purchase History.                     |
| Sequence/Flow**    |                                                      |
|                    | 2\. System loads purchases/payments (sandbox).       |
|                    |                                                      |
|                    | 3\. System shows history with filters.               |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_No purchases                                      |
| Sequences/Flows**  |                                                      |
|                    | 1\. System shows empty state.                        |
+====================+=================+==================+=================+

### 

###  2.12 Analytics Management

#### 2.12.1 View post performance

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Customer        | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a customer, I want to view post analytics so that |
|                    | I can understand impressions/clicks.                 |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • User is authenticated as Customer.                 |
|                    |                                                      |
|                    | • User owns the post.                                |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Post performance metrics are displayed.            |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. User opens Post Performance.                     |
| Sequence/Flow**    |                                                      |
|                    | 2\. System aggregates metrics (7/30 days).           |
|                    |                                                      |
|                    | 3\. System displays summary.                         |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_No data                                           |
| Sequences/Flows**  |                                                      |
|                    | 1\. System shows empty state.                        |
+====================+=================+==================+=================+

### 

#### 2.12.2 View shop performance

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Customer        | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a customer, I want to view shop analytics so that |
|                    | I can understand engagement.                         |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • User is authenticated as Customer.                 |
|                    |                                                      |
|                    | • User owns the shop.                                |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Shop performance metrics are displayed.            |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. User opens Shop Performance.                     |
| Sequence/Flow**    |                                                      |
|                    | 2\. System aggregates shop metrics.                  |
|                    |                                                      |
|                    | 3\. System displays summary.                         |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_No data                                           |
| Sequences/Flows**  |                                                      |
|                    | 1\. System shows empty state.                        |
+====================+=================+==================+=================+

### 

#### 2.12.3 View "best time to post" suggestion 

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Customer        | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a customer, I want to see best time to post so    |
|                    | that I can publish when users are active.            |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • User is authenticated as Customer.                 |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Suggested peak time windows are displayed.         |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. User opens Best Time to Post.                    |
| Sequence/Flow**    |                                                      |
|                    | 2\. System computes peak hours from engagement.      |
|                    |                                                      |
|                    | 3\. System displays suggested windows.               |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_Insufficient data                                 |
| Sequences/Flows**  |                                                      |
|                    | 1\. System shows generic suggestion and notes        |
|                    | limitation.                                          |
+====================+=================+==================+=================+

### 

###  

### 2.13 AI-assisted Insights

#### 2.13.1 View AI recommendations (optional) 

+--------------------+------------------+------------------+------------------+
| **Primary Actors** | Customer         | **Secondary      | LLM API          |
|                    |                  | Actors**         | (Gemini/OpenAI)  |
+--------------------+------------------+------------------+------------------+
| **Description**    | As a customer, I want AI recommendations so that I can |
|                    | decide what to boost based on analytics.               |
+--------------------+--------------------------------------------------------+
| **Preconditions**  | • User is authenticated as Customer.                   |
|                    |                                                        |
|                    | • Aggregated metrics are available.                    |
+--------------------+--------------------------------------------------------+
| **Postconditions** | • AI recommendation text is generated and displayed.   |
+--------------------+--------------------------------------------------------+
| **Normal\          | 1\. User taps Generate AI recommendation.              |
| Sequence/Flow**    |                                                        |
|                    | 2\. System prepares aggregated metrics.                |
|                    |                                                        |
|                    | 3\. System calls LLM and receives summary.             |
|                    |                                                        |
|                    | 4\. System displays recommendations.                   |
+--------------------+--------------------------------------------------------+
| **Alternative\     | A1_AI unavailable                                      |
| Sequences/Flows**  |                                                        |
|                    | 1\. System shows fallback message and suggests trying  |
|                    | later.                                                 |
+====================+==================+==================+==================+

### 

###  

#### 2.13.2 View AI insight history (optional) 

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Customer        | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a customer, I want to view AI insight history so  |
|                    | that I can revisit previous summaries.               |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • User is authenticated as Customer.                 |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Saved AI summaries are displayed.                  |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. User opens AI Insight History.                   |
| Sequence/Flow**    |                                                      |
|                    | 2\. System loads saved summaries.                    |
|                    |                                                      |
|                    | 3\. User opens a summary to view details.            |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_No history                                        |
| Sequences/Flows**  |                                                      |
|                    | 1\. System shows empty state.                        |
+====================+=================+==================+=================+

### 

###  

### 2.14 Category & Attribute Management

#### 2.14.1 View category list 

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Admin           | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As an admin, I want to view all categories so that I |
|                    | can manage the taxonomy.                             |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Admin is authenticated.                            |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Category list is displayed.                        |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. Admin opens Categories.                          |
| Sequence/Flow**    |                                                      |
|                    | 2\. System loads categories.                         |
|                    |                                                      |
|                    | 3\. Admin searches/sorts list.                       |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_No categories                                     |
| Sequences/Flows**  |                                                      |
|                    | 1\. System shows empty state.                        |
+====================+=================+==================+=================+

### 

###  

#### 2.14.2 Create category 

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Admin           | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As an admin, I want to create a category so that     |
|                    | users can classify posts correctly.                  |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Admin is authenticated.                            |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Category is created.                               |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. Admin clicks Create Category.                    |
| Sequence/Flow**    |                                                      |
|                    | 2\. Admin enters name/parent.                        |
|                    |                                                      |
|                    | 3\. System validates and saves category.             |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_Duplicate name                                    |
| Sequences/Flows**  |                                                      |
|                    | 1\. System shows error and asks for a different      |
|                    | name.                                                |
+====================+=================+==================+=================+

### 

#### 2.14.3 Edit or disable category 

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Admin           | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As an admin, I want to edit/disable a category so    |
|                    | that taxonomy remains accurate.                      |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Admin is authenticated.                            |
|                    |                                                      |
|                    | • Category exists.                                   |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Category is updated or disabled.                   |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. Admin opens category detail.                     |
| Sequence/Flow**    |                                                      |
|                    | 2\. Admin edits fields or disables category.         |
|                    |                                                      |
|                    | 3\. System validates and saves changes.              |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_Category in use                                   |
| Sequences/Flows**  |                                                      |
|                    | 1\. System warns or prevents disabling based on      |
|                    | policy.                                              |
+====================+=================+==================+=================+

### 

#### 2.14.4 View attribute list 

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Admin           | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As an admin, I want to view attributes so that I can |
|                    | manage structured fields for posts.                  |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Admin is authenticated.                            |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Attribute list is displayed.                       |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. Admin opens Attributes.                          |
| Sequence/Flow**    |                                                      |
|                    | 2\. System loads attributes.                         |
|                    |                                                      |
|                    | 3\. Admin searches/sorts list.                       |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_No attributes                                     |
| Sequences/Flows**  |                                                      |
|                    | 1\. System shows empty state.                        |
+====================+=================+==================+=================+

### 

###  

#### 2.14.5 Create attribute

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Admin           | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As an admin, I want to create an attribute so that   |
|                    | categories capture the right details.                |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Admin is authenticated.                            |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Attribute is created.                              |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. Admin clicks Create Attribute.                   |
| Sequence/Flow**    |                                                      |
|                    | 2\. Admin sets name/type/options.                    |
|                    |                                                      |
|                    | 3\. System validates and saves attribute.            |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_Invalid config                                    |
| Sequences/Flows**  |                                                      |
|                    | 1\. System shows validation errors and blocks save.  |
+====================+=================+==================+=================+

#### 

#### 

#### 2.14.6 Edit or disable attribute

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Admin           | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As an admin, I want to edit/disable an attribute so  |
|                    | that the schema stays correct.                       |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Admin is authenticated.                            |
|                    |                                                      |
|                    | • Attribute exists.                                  |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Attribute is updated or disabled.                  |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. Admin opens attribute detail.                    |
| Sequence/Flow**    |                                                      |
|                    | 2\. Admin edits settings or disables attribute.      |
|                    |                                                      |
|                    | 3\. System validates and saves.                      |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_Attribute in use                                  |
| Sequences/Flows**  |                                                      |
|                    | 1\. System warns about impact and applies policy.    |
+====================+=================+==================+=================+

### 

#### 2.14.7 Configure category attributes 

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Admin           | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As an admin, I want to assign attributes to          |
|                    | categories so that post forms are standardized.      |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Admin is authenticated.                            |
|                    |                                                      |
|                    | • Category and attributes exist.                     |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Mappings are saved.                                |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. Admin selects category.                          |
| Sequence/Flow**    |                                                      |
|                    | 2\. Admin selects attributes and required/order.     |
|                    |                                                      |
|                    | 3\. System saves configuration.                      |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_Invalid mapping                                   |
| Sequences/Flows**  |                                                      |
|                    | 1\. System blocks save and shows constraint errors.  |
+====================+=================+==================+=================+

### 

#### 2.14.8 Preview post form configuration

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Admin           | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As an admin, I want to preview post form             |
|                    | configuration so that I can verify the form.         |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Admin is authenticated.                            |
|                    |                                                      |
|                    | • Category configuration exists.                     |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Preview is displayed.                              |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. Admin opens Preview Form.                        |
| Sequence/Flow**    |                                                      |
|                    | 2\. System renders form for the category.            |
|                    |                                                      |
|                    | 3\. Admin reviews layout and required fields.        |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_Config missing                                    |
| Sequences/Flows**  |                                                      |
|                    | 1\. System asks admin to configure attributes first. |
+====================+=================+==================+=================+

### 

###  

### 2.15 System Settings Management

#### 2.15.1 View system settings 

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Admin           | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As an admin, I want to view system settings so that  |
|                    | I know current configuration values.                 |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Admin is authenticated.                            |
+--------------------+------------------------------------------------------+
| **Postconditions** | • System settings are displayed.                     |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. Admin opens System Settings.                     |
| Sequence/Flow**    |                                                      |
|                    | 2\. System loads current configuration.              |
|                    |                                                      |
|                    | 3\. Admin reviews settings.                          |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_Load failed                                       |
| Sequences/Flows**  |                                                      |
|                    | 1\. System shows error and suggests retry.           |
+====================+=================+==================+=================+

### 

###  

#### 2.15.2 Update system settings

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Admin           | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As an admin, I want to update system settings so     |
|                    | that platform rules and limits can be adjusted.      |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Admin is authenticated.                            |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Settings are updated and applied.                  |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. Admin edits a setting value.                     |
| Sequence/Flow**    |                                                      |
|                    | 2\. System validates allowed ranges.                 |
|                    |                                                      |
|                    | 3\. System saves changes and confirms.               |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_Invalid value                                     |
| Sequences/Flows**  |                                                      |
|                    | 1\. System rejects value and shows allowed range.    |
+====================+=================+==================+=================+

### 

#### 2.15.3 Manage content rules (banned keywords) 

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Admin           | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As an admin, I want to manage banned keywords so     |
|                    | that basic anti-spam checks can run.                 |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Admin is authenticated.                            |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Banned keyword rules are updated.                  |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. Admin opens Content Rules.                       |
| Sequence/Flow**    |                                                      |
|                    | 2\. Admin adds/edits/removes keywords.               |
|                    |                                                      |
|                    | 3\. System saves rules and applies checks.           |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_Duplicate keyword                                 |
| Sequences/Flows**  |                                                      |
|                    | 1\. System prevents duplicates and highlights        |
|                    | existing item.                                       |
+====================+=================+==================+=================+

### 

###  

#### 2.15.4 Manage post lifecycle rules 

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Admin           | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As an admin, I want to configure post lifecycle      |
|                    | rules so that posts can auto-expire and be restored  |
|                    | correctly.                                           |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Admin is authenticated.                            |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Lifecycle rules are updated.                       |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. Admin opens Lifecycle Rules.                     |
| Sequence/Flow**    |                                                      |
|                    | 2\. Admin sets expiry/restore windows.               |
|                    |                                                      |
|                    | 3\. System validates and saves rules.                |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_Invalid rule                                      |
| Sequences/Flows**  |                                                      |
|                    | 1\. System rejects invalid values and shows          |
|                    | constraints.                                         |
+====================+=================+==================+=================+

### 

### 2.16 Account Management

#### 2.16.1 View user accounts 

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Admin           | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As an admin, I want to view user accounts so that I  |
|                    | can manage access and status.                        |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Admin is authenticated.                            |
+--------------------+------------------------------------------------------+
| **Postconditions** | • User accounts list is displayed.                   |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. Admin opens User Accounts.                       |
| Sequence/Flow**    |                                                      |
|                    | 2\. System loads users with filters.                 |
|                    |                                                      |
|                    | 3\. Admin views user detail.                         |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_No users                                          |
| Sequences/Flows**  |                                                      |
|                    | 1\. System shows empty state.                        |
+====================+=================+==================+=================+

### 

#### 2.16.2 Assign or remove roles 

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Admin           | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As an admin, I want to assign/remove roles so that   |
|                    | user permissions are correct.                        |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Admin is authenticated.                            |
|                    |                                                      |
|                    | • User exists.                                       |
+--------------------+------------------------------------------------------+
| **Postconditions** | • User roles are updated.                            |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. Admin opens user account.                        |
| Sequence/Flow**    |                                                      |
|                    | 2\. Admin selects roles to add/remove.               |
|                    |                                                      |
|                    | 3\. System validates and saves roles.                |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_Invalid role                                      |
| Sequences/Flows**  |                                                      |
|                    | 1\. System blocks and shows allowed roles.           |
+====================+=================+==================+=================+

### 

#### 2.16.3 Lock user account 

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Admin           | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As an admin, I want to lock a user account so that   |
|                    | access is blocked when necessary.                    |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Admin is authenticated.                            |
|                    |                                                      |
|                    | • User is active.                                    |
+--------------------+------------------------------------------------------+
| **Postconditions** | • User status becomes Locked.                        |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. Admin selects Lock account.                      |
| Sequence/Flow**    |                                                      |
|                    | 2\. Admin confirms and optional reason.              |
|                    |                                                      |
|                    | 3\. System locks account and logs action.            |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_Already locked                                    |
| Sequences/Flows**  |                                                      |
|                    | 1\. System shows status and does nothing.            |
+====================+=================+==================+=================+

### 

### 2.16.4 Unlock user account 

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Admin           | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As an admin, I want to unlock a user account so that |
|                    | the user can access again.                           |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Admin is authenticated.                            |
|                    |                                                      |
|                    | • User is locked.                                    |
+--------------------+------------------------------------------------------+
| **Postconditions** | • User status becomes Active.                        |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. Admin selects Unlock account.                    |
| Sequence/Flow**    |                                                      |
|                    | 2\. Admin confirms.                                  |
|                    |                                                      |
|                    | 3\. System unlocks and logs action.                  |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_Not locked                                        |
| Sequences/Flows**  |                                                      |
|                    | 1\. System shows status and does nothing.            |
+====================+=================+==================+=================+

### 

#### 2.16.5 View user role assignments 

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Admin           | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As an admin, I want to view role assignments so that |
|                    | I can audit permissions.                             |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Admin is authenticated.                            |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Role assignments are displayed.                    |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. Admin opens Role Assignments.                    |
| Sequence/Flow**    |                                                      |
|                    | 2\. System lists users and roles.                    |
|                    |                                                      |
|                    | 3\. Admin filters by role.                           |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_No assignments                                    |
| Sequences/Flows**  |                                                      |
|                    | 1\. System shows empty state.                        |
+====================+=================+==================+=================+

### 

#### 2.16.6 View account activity log

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Admin           | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As an admin, I want to view account activity so that |
|                    | I can audit logins and key actions.                  |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Admin is authenticated.                            |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Activity logs are displayed.                       |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. Admin opens Activity Log.                        |
| Sequence/Flow**    |                                                      |
|                    | 2\. System loads logs by date/user.                  |
|                    |                                                      |
|                    | 3\. Admin views log detail.                          |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_No logs                                           |
| Sequences/Flows**  |                                                      |
|                    | 1\. System shows empty state.                        |
+====================+=================+==================+=================+

### 

### 2.17 Additional System Utilities

#### 2.17.1 Receive system notifications

+--------------------+---------------------+-------------------+-------------------+
| **Primary Actors** | Admin/Manager/Staff | **Secondary       | None              |
|                    |                     | Actors**          |                   |
+--------------------+---------------------+-------------------+-------------------+
| **Description**    | As a user, I want to receive system notifications so that I |
|                    | can be informed of important events.                        |
+--------------------+-------------------------------------------------------------+
| **Preconditions**  | • User is authenticated.                                    |
+--------------------+-------------------------------------------------------------+
| **Postconditions** | • Notifications are delivered and stored in inbox.          |
+--------------------+-------------------------------------------------------------+
| **Normal\          | 1\. System creates notification events.                     |
| Sequence/Flow**    |                                                             |
|                    | 2\. System delivers to user inbox.                          |
|                    |                                                             |
|                    | 3\. User can open notification details.                     |
+--------------------+-------------------------------------------------------------+
| **Alternative\     | A1_Delivery failed                                          |
| Sequences/Flows**  |                                                             |
|                    | 1\. System retries delivery and logs failure.               |
+====================+=====================+===================+===================+

#### 

#### 2.17.2 View system announcements 

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | All             | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As a user, I want to view announcements so that I    |
|                    | can see system-wide updates.                         |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Announcements exist.                               |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Announcement list is displayed.                    |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. User opens Announcements.                        |
| Sequence/Flow**    |                                                      |
|                    | 2\. System loads announcements.                      |
|                    |                                                      |
|                    | 3\. User opens an announcement to view details.      |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_No announcements                                  |
| Sequences/Flows**  |                                                      |
|                    | 1\. System shows empty state.                        |
+====================+=================+==================+=================+

###  

#### 2.17.3 Manage notification settings 

+--------------------+-----------------+-----------------+-----------------+
| **Primary Actors** | Authenticated   | **Secondary     | None            |
|                    | Users           | Actors**        |                 |
+--------------------+-----------------+-----------------+-----------------+
| **Description**    | As a user, I want to manage notification settings   |
|                    | so that I can control what I receive.               |
+--------------------+-----------------------------------------------------+
| **Preconditions**  | • User is authenticated.                            |
+--------------------+-----------------------------------------------------+
| **Postconditions** | • Notification preferences are updated.             |
+--------------------+-----------------------------------------------------+
| **Normal\          | 1\. User opens Notification Settings.               |
| Sequence/Flow**    |                                                     |
|                    | 2\. User enables/disables types.                    |
|                    |                                                     |
|                    | 3\. System saves preferences.                       |
+--------------------+-----------------------------------------------------+
| **Alternative\     | A1_Save failed                                      |
| Sequences/Flows**  |                                                     |
|                    | 1\. System shows error and allows retry.            |
+====================+=================+=================+=================+

### 

#### 2.17.4 Submit feedback to system

+--------------------+-----------------+-----------------+-----------------+
| **Primary Actors** | Authenticated   | **Secondary     | None            |
|                    | Users           | Actors**        |                 |
+--------------------+-----------------+-----------------+-----------------+
| **Description**    | As a user, I want to submit feedback so that I can  |
|                    | suggest improvements or report issues.              |
+--------------------+-----------------------------------------------------+
| **Preconditions**  | • The user is authenticated.                        |
+--------------------+-----------------------------------------------------+
| **Postconditions** | • Feedback is submitted and stored.                 |
+--------------------+-----------------------------------------------------+
| **Normal\          | 1\. User opens Feedback form.                       |
| Sequence/Flow**    |                                                     |
|                    | 2\. The user enters a message and optional          |
|                    | screenshot.                                         |
|                    |                                                     |
|                    | 3\. System validates and submits feedback.          |
+--------------------+-----------------------------------------------------+
| **Alternative\     | A1_Missing message                                  |
| Sequences/Flows**  |                                                     |
|                    | 1\. The system asks users to enter feedback         |
|                    | content.                                            |
+====================+=================+=================+=================+

### 

###  2.18 System Dashboard & Export

#### 2.18.1 View admin dashboard 

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Admin           | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As an admin, I want to view dashboard KPIs so that I |
|                    | can monitor system health and activity.              |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Admin is authenticated.                            |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Dashboard KPIs are displayed.                      |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. Admin opens Dashboard.                           |
| Sequence/Flow**    |                                                      |
|                    | 2\. The system loads KPIs and summaries.             |
|                    |                                                      |
|                    | 3\. Admin filters by time range.                     |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_No data                                           |
| Sequences/Flows**  |                                                      |
|                    | 1\. The system shows an empty state for the selected |
|                    | range.                                               |
+====================+=================+==================+=================+

### 

###  

#### 2.18.2 Export data to CSV 

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Admin           | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As an admin, I want to export data to CSV so that I  |
|                    | can do offline reporting and analysis.               |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Admin is authenticated.                            |
+--------------------+------------------------------------------------------+
| **Postconditions** | • CSV file is generated and downloadable.            |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. Admin selects export filters.                    |
| Sequence/Flow**    |                                                      |
|                    | 2\. The system generates an export dataset.          |
|                    |                                                      |
|                    | 3\. The system provides a CSV download link.         |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_Export too large                                  |
| Sequences/Flows**  |                                                      |
|                    | 1\. The system suggests narrower filters.            |
+====================+=================+==================+=================+

### 

###  

### 2.19 Promotion & Placement Admin Management

#### 2.19.1 Manage placement slots 

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Admin           | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As an admin, I want to CRUD placement slots so that  |
|                    | I can control where boosted posts appear and slot    |
|                    | capacity.                                            |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Admin is authenticated.                            |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Slot configuration is saved and applied.           |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. Admin opens Placement Slots.                     |
| Sequence/Flow**    |                                                      |
|                    | 2\. Admin creates/edits/disables slots.              |
|                    |                                                      |
|                    | 3\. System validates conflicts and saves rules.      |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_Slot conflict                                     |
| Sequences/Flows**  |                                                      |
|                    | 1\. System blocks save and shows conflict details.   |
+====================+=================+==================+=================+

### 

#### 2.19.2 Manage package plans 

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Admin           | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As an admin, I want to CRUD package plans so that    |
|                    | customers can purchase boosts by slot, duration, and |
|                    | price.                                               |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Admin is authenticated.                            |
|                    |                                                      |
|                    | • Placement slots exist.                             |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Package plans are saved and available to           |
|                    | customers.                                           |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. Admin opens Package Plans.                       |
| Sequence/Flow**    |                                                      |
|                    | 2\. Admin creates/edits/disables plans.              |
|                    |                                                      |
|                    | 3\. System validates and saves.                      |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_Invalid price/duration                            |
| Sequences/Flows**  |                                                      |
|                    | 1\. System blocks save and shows constraints.        |
+====================+=================+==================+=================+

### 

#### 2.19.3 View promotions list 

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Admin           | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As an admin, I want to view all promotions so that I |
|                    | can track active and expired boosts.                 |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Admin is authenticated.                            |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Promotion list is displayed.                       |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. Admin opens Promotions list.                     |
| Sequence/Flow**    |                                                      |
|                    | 2\. System lists boosts by post/customer, slot,      |
|                    | time.                                                |
|                    |                                                      |
|                    | 3\. Admin filters by status/date.                    |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_No promotions                                     |
| Sequences/Flows**  |                                                      |
|                    | 1\. System shows empty state.                        |
+====================+=================+==================+=================+

### 

#### 2.19.4 Enforce promotion rules 

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Admin           | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As an admin, I want to enforce promotion policies so |
|                    | that slot capacity, cooldown, and limits are         |
|                    | respected.                                           |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Admin is authenticated.                            |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Rule enforcement is applied and conflicts are      |
|                    | resolved.                                            |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. System detects conflicts/violations.             |
| Sequence/Flow**    |                                                      |
|                    | 2\. Admin reviews and applies actions.               |
|                    |                                                      |
|                    | 3\. System updates boosts/slots and logs changes.    |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_Auto-resolve suggestion                           |
| Sequences/Flows**  |                                                      |
|                    | 1\. System proposes auto-resolution and admin        |
|                    | confirms.                                            |
+====================+=================+==================+=================+

### 

### 2.20 Analytics Dashboard 

#### 2.20.1 View placement analytics dashboard 

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Admin           | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As an admin, I want to view placement analytics so   |
|                    | that I can compare slot performance by CTR and       |
|                    | conversion.                                          |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Admin is authenticated.                            |
|                    |                                                      |
|                    | • Tracking data exists.                              |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Analytics dashboard is displayed.                  |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. Admin opens Placement Analytics.                 |
| Sequence/Flow**    |                                                      |
|                    | 2\. System aggregates metrics by slot/category/time  |
|                    | (7/30 days).                                         |
|                    |                                                      |
|                    | 3\. System displays charts/tables.                   |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_No data                                           |
| Sequences/Flows**  |                                                      |
|                    | 1\. System shows empty state.                        |
+====================+=================+==================+=================+

### 

#### 2.20.2 View trend scoring report 

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Admin           | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As an admin, I want to view trend scores so that I   |
|                    | know which slots/categories/time windows are most    |
|                    | effective.                                           |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Admin is authenticated.                            |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Trend scores report is displayed.                  |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. System computes heuristic scores with smoothing. |
| Sequence/Flow**    |                                                      |
|                    | 2\. Admin opens Trend Scoring report.                |
|                    |                                                      |
|                    | 3\. System displays slot score, hot categories, peak |
|                    | hours.                                               |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_Insufficient data                                 |
| Sequences/Flows**  |                                                      |
|                    | 1\. System shows partial scores and notes            |
|                    | limitation.                                          |
+====================+=================+==================+=================+

### 

### 2.21 AI-assisted Insights 

#### 2.21.1 Generate AI insight summary (optional)

+--------------------+------------------+------------------+------------------+
| **Primary Actors** | Admin            | **Secondary      | LLM API          |
|                    |                  | Actors**         | (Gemini/OpenAI)  |
+--------------------+------------------+------------------+------------------+
| **Description**    | As an admin, I want AI-generated insight summaries so  |
|                    | that I can quickly understand analytics and actions.   |
+--------------------+--------------------------------------------------------+
| **Preconditions**  | • Admin is authenticated.                              |
|                    |                                                        |
|                    | • Aggregated analytics metrics are available.          |
+--------------------+--------------------------------------------------------+
| **Postconditions** | • AI insight summary is generated and displayed.       |
+--------------------+--------------------------------------------------------+
| **Normal\          | 1\. Admin clicks Generate AI summary.                  |
| Sequence/Flow**    |                                                        |
|                    | 2\. System prepares aggregated metrics (no raw         |
|                    | personal data).                                        |
|                    |                                                        |
|                    | 3\. System calls LLM and receives summary.             |
|                    |                                                        |
|                    | 4\. System displays and stores summary (optional).     |
+--------------------+--------------------------------------------------------+
| **Alternative\     | A1_AI unavailable                                      |
| Sequences/Flows**  |                                                        |
|                    | 1\. System shows fallback message and suggests trying  |
|                    | later.                                                 |
+====================+==================+==================+==================+

### 

#### 2.21.2 Manage AI insight settings (optional)

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Admin           | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As an admin, I want to configure AI insights so that |
|                    | I can control prompts, refresh rules, and outputs.   |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Admin is authenticated.                            |
+--------------------+------------------------------------------------------+
| **Postconditions** | • AI insight settings are saved and applied.         |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. Admin opens AI Insight Settings.                 |
| Sequence/Flow**    |                                                      |
|                    | 2\. Admin enables/disables AI and edits              |
|                    | template/frequency.                                  |
|                    |                                                      |
|                    | 3\. System validates and saves settings.             |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_Invalid template                                  |
| Sequences/Flows**  |                                                      |
|                    | 1\. System blocks save and highlights invalid        |
|                    | fields.                                              |
+====================+=================+==================+=================+

### 

###  

### 2.22 Financial Analytics

#### 2.22.1 View revenue summary

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Admin           | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As an admin, I want to view revenue summary so that  |
|                    | I can understand total income from promotion         |
|                    | packages.                                            |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Admin is authenticated.                            |
|                    |                                                      |
|                    | • Payment records exist (sandbox).                   |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Revenue summary is displayed.                      |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. Admin opens Revenue Summary.                     |
| Sequence/Flow**    |                                                      |
|                    | 2\. System aggregates revenue by date/slot/plan.     |
|                    |                                                      |
|                    | 3\. System displays totals and breakdown.            |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_No payments                                       |
| Sequences/Flows**  |                                                      |
|                    | 1\. System shows empty state.                        |
+====================+=================+==================+=================+

### 

#### 2.22.2 View customer spending report (sandbox) 

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Admin           | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As an admin, I want to view customer spending so     |
|                    | that I can analyze purchase behavior and top         |
|                    | spenders.                                            |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Admin is authenticated.                            |
|                    |                                                      |
|                    | • Payment records exist (sandbox).                   |
+--------------------+------------------------------------------------------+
| **Postconditions** | • Customer spending report is displayed.             |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. Admin opens Customer Spending report.            |
| Sequence/Flow**    |                                                      |
|                    | 2\. System aggregates spending per customer.         |
|                    |                                                      |
|                    | 3\. Admin views totals and purchase list.            |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_No data                                           |
| Sequences/Flows**  |                                                      |
|                    | 1\. System shows empty state.                        |
+====================+=================+==================+=================+

### 

#### 2.22.3 Export financial report to CSV (sandbox) 

+--------------------+-----------------+------------------+-----------------+
| **Primary Actors** | Admin           | **Secondary      | None            |
|                    |                 | Actors**         |                 |
+--------------------+-----------------+------------------+-----------------+
| **Description**    | As an admin, I want to export financial reports so   |
|                    | that I can do external accounting and analysis.      |
+--------------------+------------------------------------------------------+
| **Preconditions**  | • Admin is authenticated.                            |
|                    |                                                      |
|                    | • Financial data exists (sandbox).                   |
+--------------------+------------------------------------------------------+
| **Postconditions** | • CSV financial report is generated and              |
|                    | downloadable.                                        |
+--------------------+------------------------------------------------------+
| **Normal\          | 1\. Admin selects export filters.                    |
| Sequence/Flow**    |                                                      |
|                    | 2\. System generates CSV report.                     |
|                    |                                                      |
|                    | 3\. System provides download link.                   |
+--------------------+------------------------------------------------------+
| **Alternative\     | A1_Export too large                                  |
| Sequences/Flows**  |                                                      |
|                    | 1\. System suggests narrower filters.                |
+====================+=================+==================+=================+

### 

###  

### 

##  

## 3. Functional Requirements

### 3.1 Splash

  ---------------------------------------------------------------------
  ![](media/image48.png){width="3.6416885389326334in"
  height="7.880208880139983in"}
  ---------------------------------------------------------------------

  ---------------------------------------------------------------------

*Figure 3.1: Splash of GreenMarket*

### 3.2 Authentication Management

#### 3.2.1 Login

  -------------------------------------------------------------------
  ![](media/image34.png){width="3.785511811023622in"
  height="8.32812554680665in"}
  -------------------------------------------------------------------

  -------------------------------------------------------------------

*Figure 3.2.1: Login screen of GreenMarket*

This screen allows the User, all actors of system to:

- Login: log into the system using their credentials

+----------+--------------------------------------------------------+
| **Field  | **Description**                                        |
| Name**   |                                                        |
+----------+--------------------------------------------------------+
| Số điện  | Data type: Number                                      |
| thoại    |                                                        |
|          | Format: must be a valid phone format (e.g.,            |
|          | 0987654321)                                            |
|          |                                                        |
|          | Initial: empty                                         |
|          |                                                        |
|          | Required: Yes                                          |
+----------+--------------------------------------------------------+
| "Gửi mã  | Action button: send OTP.                               |
| xác      |                                                        |
| minh"    |                                                        |
| button   |                                                        |
+==========+========================================================+

#### 3.2.2 Verify OTP

#### 

  -----------------------------------------------------------------------
  ![](media/image30.png){width="3.7031255468066493in"
  height="8.13456583552056in"}
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

#### 

*Figure 3.2.2: verify OTP screen of GreenMarket*

This screen allows the User to:

- Type OTP and verify & login account

  ---------------------------------------------------------------------
  **Field      **Description**
  Name**       
  ------------ --------------------------------------------------------
  OTP          String, masked, required.

  "Xác minh và Action: verify OTP and login
  đăng nhập"   
  button       
  ---------------------------------------------------------------------

#### 3.2.3 Register

  ----------------------------------------------------------------------
  ![](media/image5.png){width="3.970312773403325in"
  height="8.76562554680665in"}
  ----------------------------------------------------------------------

  ----------------------------------------------------------------------

*Figure 3.2.3: Register screen of GreenMarket*

This screen allows the User to:

- Create a new account by providing basic personal information.

  ---------------------------------------------------------------------
  **Field      **Description**
  Name**       
  ------------ --------------------------------------------------------
  Số điện      String, required.
  thoại        

  Tên          String, required.

  Email (tuỳ   String, optional.
  chọn)        

  "Đăng ký"    Action: register new account and proceed to OTP
  button       verification.
  ---------------------------------------------------------------------

### 3.3 Profile Management

#### 3.3.1 View profile

  -----------------------------------------------------------------------
  ![](media/image6.png){width="3.3125in" height="7.333333333333333in"}
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

*Figure 3.3.1: Profile screen of GreenMarket*

This screen allows the User to:

- **View profile information:** view personal information including
  avatar, name, phone number, email, and role.

- **Edit profile:** navigate to edit profile screen.

- **Access settings:** access notification, privacy, language, and legal
  information settings.

- **Logout:** log out from the current account.

  ---------------------------------------------------------------------
  **Field     **Description**
  Name**      
  ----------- ---------------------------------------------------------
  Ảnh đại     Image. Display user avatar.
  diện        

  Tên         String. Display user name.

  Số điện     String. Display user phone number.
  thoại       

  Email       String. Display user email.

  Vai trò     String. Display user role.

  "Chỉnh sửa  Action. Navigate to edit profile screen.
  hồ sơ"      
  button      

  Thông báo   Action. Navigate to notification settings.

  Quyền riêng Action. Navigate to privacy settings.
  tư          

  Ngôn ngữ    Action. Navigate to language settings.

  Giới thiệu  Action. Navigate to about and legal information.
  & pháp lý   

  "Đăng xuất" Action. Log out from the current account.
  button      
  ---------------------------------------------------------------------

#### 

#### 3.3.2 Edit Profile

  ----------------------------------------------------------------------
  ![](media/image73.png){width="3.9194346019247592in"
  height="8.692708880139982in"}
  ----------------------------------------------------------------------

  ----------------------------------------------------------------------

*Figure 3.3.2: Edit profile screen of GreenMarket*

**This screen allows the User to:**

- **View current profile information:** view existing personal
  information.

- **Update profile information:** update name, email, and avatar.

- **Save changes:** save updated profile information.

- **Cancel editing:** discard changes and return to profile screen.

  ---------------------------------------------------------------------
  **Field     **Description**
  Name**      
  ----------- ---------------------------------------------------------
  Ảnh đại     Image. Display user avatar.
  diện        

  "Thay ảnh"  Action. Select and update user avatar.
  button      

  Họ và tên   String, required. Editable user full name.

  Số điện     String, read-only. Display user phone number.
  thoại       

  Email       String. Display user role.

  "Chỉnh sửa  String, optional. Editable user email.
  hồ sơ"      
  button      

  "Lưu thay   Action. Save updated profile information.
  đổi" button 

  "Hủy"       Action. Cancel editing and return to profile screen.
  button      
  ---------------------------------------------------------------------

#### 

### 3.4 Collaborator

#### 3.4.1 Earning

  ----------------------------------------------------------------------
  ![](media/image4.png){width="3.78125in" height="8.277777777777779in"}
  ----------------------------------------------------------------------

  ----------------------------------------------------------------------

*Figure 3.4.1: Collaborator earnings screen of GreenMarket*

**This screen allows the User to:**

- **View total earnings:** view total income earned as a collaborator.

- **View earning summary:** view number of transactions and average
  income per transaction.

- **View earnings by type:** view earnings grouped by earning type.

- **View earning history:** view detailed earning transaction history.

  ---------------------------------------------------------------------
  **Field Name**  **Description**
  --------------- -----------------------------------------------------
  Tổng thu nhập   Number, calculated. Display total collaborator
                  earnings.

  Giao dịch       Number. Display total number of earning transactions.

  TB / giao dịch  Number, calculated. Display average earning per
                  transaction.

  Chi tiết theo   List. Display earnings grouped by earning type.
  loại            

  Lịch sử thu     List. Display earning transaction history.
  nhập            

  Mục thu nhập    Item. Display earning title, type, and amount.
  ---------------------------------------------------------------------

#### 

#### 3.4.2 Manage jobs

  -----------------------------------------------------------------------
  ![](media/image31.png){width="3.8854166666666665in"
  height="8.541666666666666in"}
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

*Figure 3.4.2: Available jobs screen of GreenMarket*

**This screen allows the User to:**

- **View available jobs:** view and browse available collaborator jobs.

- **Filter jobs:** filter jobs by job category or keyword.

- **View job information:** view job title, category, location,
  deadline, and price.

  ---------------------------------------------------------------------
  **Field     **Description**
  Name**      
  ----------- ---------------------------------------------------------
  Ô lọc công  String, optional. Used to filter jobs by category or
  việc        keyword.

  Danh sách   List. Display available jobs.
  công việc   

  Tiêu đề     String. Display job title.
  công việc   

  Danh mục    String. Display job category.
  công việc   

  Khu vực     String. Display job location.

  Hạn chót    Date/Time. Display job application deadline.

  Giá công    Number. Display job payment amount.
  việc        

  Thẻ công    Action. Select to view job details.
  việc        
  ---------------------------------------------------------------------

#### 3.4.3 My Jobs

  -----------------------------------------------------------------------
  ![](media/image32.png){width="3.9101902887139106in"
  height="8.651042213473316in"}
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

*Figure 3.4.3: My jobs screen of GreenMarket*

**This screen allows the User to:**

- **View assigned jobs:** view jobs assigned to the collaborator.

- **Filter jobs by status:** switch between Active, Completed, and
  Cancelled jobs.

- **Track job progress:** view progress status of each job.

  ---------------------------------------------------------------------
  **Field     **Description**
  Name**      
  ----------- ---------------------------------------------------------
  Tab Active  Action. Display active jobs.

  Tab         Action. Display completed jobs.
  Completed   

  Tab         Action. Display cancelled jobs.
  Cancelled   

  Danh sách   List. Display collaborator jobs.
  công việc   

  Tiêu đề     String. Display job title.
  công việc   

  Trạng thái  Status. Display current job status.
  công việc   

  Thanh tiến  Progress, percentage. Display job completion progress.
  độ          

  Thẻ công    Action. Select to view job details.
  việc        
  ---------------------------------------------------------------------

#### 

#### 3.4.4 Job Detail

  -----------------------------------------------------------------------
  ![](media/image14.png){width="3.9843755468066493in"
  height="8.785492125984252in"}
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

> *Figure 3.4.4: Job detail screen of GreenMarket*

**This screen allows the User to:**

- **View job details:** view full information of a job including title,
  price, location, deadline, description, and requirements.

- **View client information:** view limited client information before
  accepting the job.

- **Accept job:** accept and start the selected job.

- **Decline job:** decline the selected job.

- **Contact client:** request more information about the job.

- 

  ---------------------------------------------------------------------
  **Field     **Description**
  Name**      
  ----------- ---------------------------------------------------------
  Tiêu đề     String. Display job title.
  công việc   

  Giá công    Number. Display job payment amount.
  việc        

  Khu vực     String. Display job location.

  Hạn chót    Date. Display job deadline.

  Mô tả công  Text. Display job description.
  việc        

  Yêu cầu     List. Display job requirements.

  Thông tin   Text, limited. Display limited client information before
  khách hàng  job acceptance.

  "Nhận việc" Action. Accept the job.
  button      

  "Từ chối"   Action. Decline the job.
  button      

  "Hỏi thêm"  Action. Contact client for more information.
  button      
  ---------------------------------------------------------------------

#### 

#### 3.4.5 Submit Job Result

  -----------------------------------------------------------------------
  ![](media/image50.png){width="3.935029527559055in"
  height="8.64062554680665in"}
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

*Figure 3.4.5: Submit job result screen of GreenMarket*

**This screen allows the User to:**

- **Upload job results:** upload files related to the completed job.

- **Add notes:** provide additional notes or explanations for the
  client.

- **Submit results:** submit job results for client review and approval.

  --------------------------------------------------------------------
  **Field     **Description**
  Name**      
  ----------- --------------------------------------------------------
  Tệp kết quả File, multiple. Upload job result files.

  Ghi chú cho Text, optional. Add notes for the client.
  khách hàng  

  "Nộp để     Action. Submit job results for review.
  duyệt"      
  button      
  --------------------------------------------------------------------

#### 

#### 3.4.6 Request payout

  ----------------------------------------------------------------------
  ![](media/image11.png){width="3.873320209973753in"
  height="8.630208880139982in"}
  ----------------------------------------------------------------------

  ----------------------------------------------------------------------

*Figure 3.4.6: Request payout screen of GreenMarket*

**This screen allows the User to:**

- **Request payout:** submit a payout request with selected amount and
  method.

- **Select payout method:** choose a payout method.

- **View payout history:** view previous payout requests and their
  statuses.

  --------------------------------------------------------------------
  **Field Name**  **Description**
  --------------- ----------------------------------------------------
  Số tiền         Number, required. Payout amount (minimum 500,000đ).

  Phương thức rút Option. Select payout method.
  tiền            

  "Gửi yêu cầu"   Action. Submit payout request.
  button          

  Lịch sử rút     List. Display payout history.
  tiền            

  Ngày rút tiền   Date. Display payout request date.

  Số tiền rút     Number. Display payout amount.

  Trạng thái      Status. Display payout request status.
  --------------------------------------------------------------------

#### 

### 3.5 Favorite

#### 3.5.1 Favorite screen

  ---------------------------------------------------------------------
  ![](media/image76.png){width="3.7968755468066493in"
  height="8.284091207349082in"}
  ---------------------------------------------------------------------

  ---------------------------------------------------------------------

*Figure 3.5.1: Favorites screen of GreenMarket*

**This screen allows the User to:**

- **View favorite listings:** view and browse saved listings.

- **Sort favorites:** sort favorite listings by saved time or price.

- **Remove favorites:** remove selected listings from favorites.

- **Clear favorites:** remove all favorite listings.

- **View empty state:** view empty state when no favorite listings
  exist.

- **View listing detail:** navigate to listing detail screen.

  --------------------------------------------------------------------
  **Field     **Description**
  Name**      
  ----------- --------------------------------------------------------
  Mới lưu     Sort option. Sort favorites by latest saved time.

  Giá         Sort option. Sort favorites by price.

  Bỏ yêu      Action. Remove selected listings from favorites.
  thích       

  Xóa tất cả  Action. Remove all favorite listings.

  Danh sách   List. Display saved listings.
  tin yêu     
  thích       

  Tin yêu     Item. Display listing image, title, price, and location.
  thích       

  Trạng thái  State. Display empty favorites message.
  rỗng        

  Thẻ tin     Action. Navigate to listing detail screen.
  --------------------------------------------------------------------

### 3.6 Host

#### 3.6.1 Create Promotional Content

  ----------------------------------------------------------------------
  ![](media/image25.png){width="3.4479166666666665in"
  height="7.611111111111111in"}
  ----------------------------------------------------------------------

  ----------------------------------------------------------------------

*Figure 3.6.1: Create promotional content screen of GreenMarket*

**This screen allows the User to:**

- **Create promotional content:** create promotional content with title,
  description, CTA link, and media.

- **Preview content:** preview promotional content before publishing.

- **Publish content:** submit and create promotional content.

  --------------------------------------------------------------------
  **Field Name**  **Description**
  --------------- ----------------------------------------------------
  Tiêu đề         String, required. Promotional content title.

  Nội dung quảng  Text, required. Promotional content description.
  bá              

  Link CTA        URL, optional. Call-to-action link.

  Tệp đính kèm    File, multiple, optional. Upload promotional media
                  files.

  Preview         View. Display promotional content preview.
  --------------------------------------------------------------------

#### 3.6.2 Host Dashboard

  -----------------------------------------------------------------------
  ![](media/image53.png){width="3.868173665791776in"
  height="8.57812554680665in"}
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

*Figure 3.6.2: Create medical record screen of GreenMarket*

**This screen allows the User to:**

- **View performance statistics:** view total views, clicks, and
  earnings.

- **Monitor content performance:** view performance of recent
  promotional contents.

  --------------------------------------------------------------------
  **Field Name**  **Description**
  --------------- ----------------------------------------------------
  Lượt xem        Number. Display total content views.

  Lượt click      Number. Display total content clicks.

  Thu nhập        Number. Display total earnings.

  Hiệu suất nội   List. Display recent promotional content
  dung gần đây    performance.

  Tiêu đề nội     String. Display content title.
  dung            

  Lượt xem nội    Number. Display views per content.
  dung            
  --------------------------------------------------------------------

#### 3.6.3 Host Earning

  -----------------------------------------------------------------------
  ![](media/image16.png){width="3.963542213473316in"
  height="8.723540026246718in"}
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

*Figure 3.6.3: Host earnings screen of GreenMarket*

**This screen allows the User to:**

- **View total earnings:** view total earnings as a host.

- **View pending earnings:** view earnings waiting for payment.

- **View earnings by content:** view earnings breakdown by promotional
  content.

- **View performance over time:** view earnings performance over time.

  --------------------------------------------------------------------
  **Field Name**  **Description**
  --------------- ----------------------------------------------------
  Tổng thu nhập   Number, calculated. Display total host earnings.

  Chờ thanh toán  Number. Display pending earnings awaiting payment.

  Thu nhập theo   List. Display earnings grouped by content.
  nội dung        

  Tiêu đề nội     String. Display promotional content title.
  dung            

  Thu nhập nội    Number. Display earnings per content.
  dung            
  --------------------------------------------------------------------

#### 

#### 3.6.4 Request payout

  -----------------------------------------------------------------------
  ![](media/image11.png){width="3.873320209973753in"
  height="8.630208880139982in"}
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

*Figure 3.6.4: Request payout screen of GreenMarket*

**This screen allows the User to:**

- **Request payout:** submit a payout request with selected amount and
  method.

- **Select payout method:** choose a payout method.

- **View payout history:** view previous payout requests and their
  statuses.

  --------------------------------------------------------------------
  **Field Name**  **Description**
  --------------- ----------------------------------------------------
  Số tiền         Number, required. Payout amount (minimum 500,000đ).

  Phương thức rút Option. Select payout method.
  tiền            

  "Gửi yêu cầu"   Action. Submit payout request.
  button          

  Lịch sử rút     List. Display payout history.
  tiền            

  Ngày rút tiền   Date. Display payout request date.

  Số tiền rút     Number. Display payout amount.

  Trạng thái      Status. Display payout request status.
  --------------------------------------------------------------------

#### 

### 3.7 Home

#### 3.7.1 Home

  -----------------------------------------------------------------------
  ![](media/image8.png){width="3.821325459317585in"
  height="8.505208880139982in"}
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

*Figure 3.7.1: Home feed screen of GreenMarket*

> This screen allows the User to:

- **View listings:** view and browse available plant listings.

- **Search listings:** search listings by keyword (plants or shops).

- **Filter listings:** filter listings by selected categories.

- **Sort listings:** sort listings by latest, price (low to high / high
  to low), or nearest location.

- **View listing detail:** select a listing to navigate to the listing
  detail screen.

  --------------------------------------------------------------------
  **Field Name**  **Description**
  --------------- ----------------------------------------------------
  Tìm kiếm cây    String, optional. Used to search listings by
  cảnh, shop...   keyword.

  Danh mục        List, selectable. Used to filter listings by
                  category.

  Mới nhất        Sort option. Sort listings by latest time.

  Giá thấp        Sort option. Sort listings by ascending price.

  Giá cao         Sort option. Sort listings by descending price.

  Gần tôi         Sort option. Sort listings by nearest location.

  Bài đăng        List. Display available listings.

  Nhãn VIP        Badge, conditional. Displayed for VIP listings.

  Nhãn Mới        Badge, conditional. Displayed for new listings.

  Thẻ bài đăng    Action. Navigate to listing detail screen.
  --------------------------------------------------------------------

#### 

#### 3.7.2 Post Detail

  -----------------------------------------------------------------------
  ![](media/image24.png){width="3.8333333333333335in"
  height="8.444444444444445in"}
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

*Figure 3.7.2: Post detail screen of GreenMarket*

**This screen allows the User to:**

- **View post details:** view full listing information including images,
  title, price, location, time, description, and attributes.

- **View seller information:** view basic shop information of the
  listing.

- **Interact with post:** add post to favorites, share post, or report
  post.

- **Contact seller:** contact the seller directly.

- **View related listings:** view other related listings.

  --------------------------------------------------------------------
  **Field Name**  **Description**
  --------------- ----------------------------------------------------
  Hình ảnh tin    Image. Display listing images.

  Tiêu đề tin     String. Display listing title.

  Giá             Number. Display listing price.

  Vị trí & thời   String. Display listing location and creation time.
  gian            

  Thông tin chi   List. Display listing attributes.
  tiết            

  Cửa hàng        Text. Display shop information.

  Yêu thích       Action. Add or remove listing from favorites.

  Chia sẻ         Action. Share listing.

  Báo cáo         Action. Report listing.

  "Liên hệ"       Action. Contact the seller.
  button          

  Tin liên quan   List. Display related listings.

  Thẻ tin liên    Action. Navigate to related listing detail.
  quan            
  --------------------------------------------------------------------

### 

#### 3.7.3 Search & Filter

  -----------------------------------------------------------------------
  ![](media/image54.png){width="3.994792213473316in"
  height="8.786524496937883in"}
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

*Figure 3.7.3: Search and filter screen of GreenMarket*

**This screen allows the User to:**

- **Search listings:** search listings by keyword with suggestions.

- **Filter listings:** filter listings by category, price range,
  location, and attributes.

- **Sort listings:** sort listings by selected criteria.

- **Apply filters:** apply selected search and filter conditions.

  --------------------------------------------------------------------
  **Field Name**  **Description**
  --------------- ----------------------------------------------------
  Ô tìm kiếm      String, optional. Search listings by keyword.

  Danh mục        List, selectable. Filter listings by category.

  Khoảng giá      Range. Filter listings by price range.

  Địa điểm        String, optional. Filter listings by location.

  Thuộc tính      Dynamic list. Filter listings by category-specific
                  attributes.

  Mới nhất        Sort option. Sort listings by latest.

  Giá thấp        Sort option. Sort listings by ascending price.

  Giá cao         Sort option. Sort listings by descending price.

  "Áp dụng"       Action. Apply selected filters and return to listing
  button          results.
  --------------------------------------------------------------------

### 

### 3.8 Moderation 

#### 3.8.1 Moderation Dashboard

  -----------------------------------------------------------------------
  ![](media/image63.png){width="3.7447528433945756in"
  height="8.23437554680665in"}
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

*Figure 3.8.1: Moderation dashboard screen of GreenMarket*

**This screen allows the User to:**

- **View moderation statistics:** view numbers of pending posts, pending
  reports, and resolved cases.

- **Access priority moderation:** quickly access high-priority items for
  moderation.

  --------------------------------------------------------
  **Field Name**  **Description**
  --------------- ----------------------------------------
  Chờ duyệt       Number. Display number of pending posts.

  Báo cáo chưa xử Number. Display number of unresolved
  lý              reports.

  Đã xử lý hôm    Number. Display number of cases resolved
  nay             today.

  Duyệt nhanh     Action. Navigate to high-priority
                  moderation tasks.
  --------------------------------------------------------

#### 3.8.2 Moderation History

  -----------------------------------------------------------------------
  ![](media/image57.png){width="3.7864588801399823in"
  height="8.43487423447069in"}
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

*Figure 3.8.2: Moderation history screen of GreenMarket*

**This screen allows the User to:**

- **View moderation history:** view past moderation actions.

- **Filter history:** filter moderation records by date range and action
  type.

- **Review action details:** view details of each moderation action.

  --------------------------------------------------------
  **Field Name**  **Description**
  --------------- ----------------------------------------
  Khoảng ngày     Filter. Filter moderation history by
                  date range.

  Loại action     Filter. Filter moderation history by
                  action type.

  Lịch sử         List. Display moderation history
  moderation      records.

  Ngày            Date. Display moderation action date.

  Action          String. Display moderation action type.

  Đối tượng       String. Display moderated target.

  Moderator       String. Display moderator information.
  --------------------------------------------------------

#### 3.8.3 Moderate Post Detail

  -----------------------------------------------------------------------
  ![](media/image55.png){width="3.901042213473316in"
  height="8.586365923009623in"}
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

*Figure 3.8.3: Moderate post detail screen of GreenMarket*

**This screen allows the User to:**

- **View post details:** view full post information before moderation.

- **Review system warnings:** view detected sensitive content warnings.

- **Add moderation notes:** add notes for the post owner.

- **Approve post:** approve and publish the post.

- **Reject post:** reject the post.

- **Hide post:** temporarily hide the post from public view.

- **Escalate issue:** report the post to admin for further review.

  -------------------------------------------------------------
  **Field Name**      **Description**
  ------------------- -----------------------------------------
  Thông tin tin đăng  View. Display post title, price, and
                      description.

  Cảnh báo hệ thống   Warning. Display detected sensitive
                      content alerts.

  Ghi chú cho người   Text, optional. Add moderation notes.
  đăng                

  "Phê duyệt" button  Action. Approve and publish the post.

  "Từ chối" button    Action. Reject the post.

  "Ẩn tạm thời"       Action. Temporarily hide the post.
  button              

  "Báo cáo Admin"     Action. Escalate post to admin for
  button              further moderation.
  -------------------------------------------------------------

#### 3.8.4 Moderate Post Detail

  -----------------------------------------------------------------------
  ![](media/image1.png){width="3.869792213473316in"
  height="8.575458223972003in"}
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

*Figure 3.8.4: Moderate post detail screen of GreenMarket*

**This screen allows the User to:**

- **View post details:** view full post information before moderation.

- **Review system warnings:** view detected sensitive content warnings.

- **Add moderation notes:** add notes for the post owner.

- **Approve post:** approve and publish the post.

- **Reject post:** reject the post.

- **Hide post:** temporarily hide the post from public view.

- **Escalate issue:** report the post to admin for further review.

  ------------------------------------------------------------
  **Field Name**     **Description**
  ------------------ -----------------------------------------
  Thông tin tin đăng View. Display post title, price, and
                     description.

  Cảnh báo hệ thống  Warning. Display detected sensitive
                     content alerts.

  Ghi chú cho người  Text, optional. Add moderation notes.
  đăng               

  "Phê duyệt" button Action. Approve and publish the post.

  "Từ chối" button   Action. Reject the post.

  "Ẩn tạm thời"      Action. Temporarily hide the post.
  button             

  "Báo cáo Admin"    Action. Escalate post to admin for
  button             further moderation.
  ------------------------------------------------------------

#### 3.8.5 Moderation Statistics

  -----------------------------------------------------------------------
  ![](media/image9.png){width="3.8489588801399823in"
  height="8.524662073490815in"}
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

*Figure 3.8.5: Moderation statistics screen of GreenMarket*

**This screen allows the User to:**

- **View moderation trends:** view approval and rejection statistics
  over time.

- **Analyze violation types:** view most common violation categories.

- **Evaluate moderator performance:** view moderation performance by
  moderator.

  **Field Name**              **Description**
  --------------------------- -------------------------------------------------------------------------------
  Duyệt / Từ chối theo ngày   Chart. Display number of approved and rejected posts by date.
  Loại vi phạm phổ biến       Chart/List. Display most frequent violation types detected during moderation.
  Hiệu suất moderator         Chart/List. Display moderation activity and performance per moderator.

### 3.9 Operations

#### 3.9.1 Daily Workload

  -----------------------------------------------------------------------
  ![](media/image17.png){width="3.7430741469816273in"
  height="8.30336832895888in"}
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

*Figure 3.9.1: Daily workload screen of GreenMarket*

**This screen allows the User to:**

- **View current workload status:** view number of open, in-progress,
  and closed tasks.

- **Monitor daily performance:** view number of tasks resolved today.

- **Track response efficiency:** view average response time for today.

- **Analyze workload distribution:** view workload trends by hour.

  ---------------------------------------------------------------------
  **Field Name**    **Description**
  ----------------- ---------------------------------------------------
  Đang mở           Number. Display total tasks currently open.

  Đang xử lý        Number. Display tasks currently in progress.

  Đã đóng           Number. Display tasks completed and closed today.

  Xử lý hôm nay     Number. Display total tasks resolved today.

  Thời gian phản    Time. Display average response time for tasks
  hồi TB            today.

  Biểu đồ workload  Chart. Display task workload distribution by hour.
  theo giờ          
  ---------------------------------------------------------------------

#### 3.9.2 Task Detail

### 

  -----------------------------------------------------------------------
  ![](media/image10.png){width="3.62122375328084in"
  height="8.038097112860893in"}
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

*Figure 3.9.2: Task detail screen of GreenMarket*

**This screen allows the User to:**

- **View ticket information:** view title, user, category, priority, and
  creation time.

- **Read customer content:** view detailed issue reported by the
  customer.

- **Perform ticket actions:** reply to customer, escalate the ticket, or
  close the ticket.

- **Track processing history:** view the timeline of actions taken on
  the ticket.

  ---------------------------------------------------------------------
  **Field Name**    **Description**
  ----------------- ---------------------------------------------------
  Tiêu đề ticket    Text. Display the main issue title reported by the
                    customer.

  Người gửi         Text. Display user identifier related to the
                    ticket.

  Danh mục & ưu     Text. Display ticket category and priority level.
  tiên              

  Thời gian tạo     DateTime. Display when the ticket was created.

  Nội dung khách    Text. Display full message from the customer.
  hàng              

  Trả lời khách     Action button. Allow operator to respond to the
                    customer.

  Chuyển cấp trên   Action button. Escalate ticket to higher-level
                    support or admin.

  Đóng ticket       Action button. Mark the ticket as resolved and
                    closed.

  Lịch sử xử lý     Timeline. Display chronological list of actions on
                    the ticket.
  ---------------------------------------------------------------------

#### 

#### 3.9.3 Task Queue

  -----------------------------------------------------------------------
  ![](media/image35.png){width="3.8802088801399823in"
  height="8.601128608923885in"}
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

*Figure 3.9.3: Task queue screen of GreenMarket*

**This screen allows the User to:**

- **View task list:** view all assigned tasks in the work queue.

- **Filter tasks:** filter tasks by status and task type.

- **Identify priority:** quickly recognize task priority levels.

- **Access task detail:** select a task to view its detailed
  information.

  -----------------------------------------------------------
  **Field Name** **Description**
  -------------- --------------------------------------------
  Bộ lọc trạng   Select. Filter tasks by status (Open, In
  thái           Progress, Closed).

  Bộ lọc loại    Select. Filter tasks by type (Support,
  ticket         Payment, Report).

  Tiêu đề ticket Text. Display short description of the task.

  Loại ticket    Text. Display task category.

  Khách hàng     Text. Display customer identifier related to
                 the task.

  Thời gian tạo  DateTime. Display when the task was created.

  Độ ưu tiên     Badge. Display task priority level (Low,
                 Medium, High).

  Thẻ task       Action item. Navigate to task detail screen
                 when selected.
  -----------------------------------------------------------

### 3.10 Reports

#### 3.10.1 My Reports

  -----------------------------------------------------------------------
  ![](media/image56.png){width="3.8802088801399823in"
  height="8.522237532808399in"}
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

*Figure 3.10.1: My Reports screen of GreenMarket*

**This screen allows the User to:**

- **View submitted reports:** view all reports submitted by the user.

- **Filter reports:** filter reports by processing status.

- **Track resolution status:** monitor the handling progress of each
  report.

- **Review report details:** view report target, reason, and submission
  date.

  -----------------------------------------------------------
  **Field Name**  **Description**
  --------------- -------------------------------------------
  Bộ lọc trạng    Tabs. Filter reports by status (All,
  thái            Processing, Resolved).

  Đối tượng báo   Text. Display the reported post, shop, or
  cáo             user.

  Lý do báo cáo   Text. Display the reason provided by the
                  user.

  Trạng thái báo  Status label. Processing / Resolved /
  cáo             Cancelled.

  Ngày gửi        Date. Display report submission date.

  Thẻ báo cáo     View-only item. Display report summary
                  information.
  -----------------------------------------------------------

#### 

#### 3.10.2 Edit shop

  -----------------------------------------------------------------------
  ![](media/image18.png){width="3.957370953630796in"
  height="8.682292213473316in"}
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

*Figure 3.10.2: Report detail screen of GreenMarket*

**This screen allows the User to:**

- **View report information:** view reported target, reason, and
  detailed description.

- **View attached evidence:** view images or files attached to the
  report.

- **Track processing progress:** follow each step of the report handling
  timeline.

- **View final result:** view the resolution result once the report is
  completed.

- **Cancel report:** cancel the report while it is still under
  processing.

  **Field Name**       **Description**
  -------------------- ---------------------------------------------------------------------------------------
  Đối tượng báo cáo    Text. Display the reported post, shop, or user.
  Lý do báo cáo        Text. Display the selected report reason.
  Mô tả chi tiết       Text. Display additional explanation provided by the user.
  Hình ảnh đính kèm    Image gallery. Display all evidence images attached to the report.
  Tiến trình xử lý     Timeline. Display report handling steps with status indicators (Pending / Completed).
  Kết quả xử lý        Text. Display final resolution result after report is resolved.
  Trạng thái báo cáo   Status. Processing / Resolved / Cancelled.
  Nút hủy báo cáo      Action button. Allow user to cancel the report when status is Processing.

#### 3.10.3 Create Report

  -----------------------------------------------------------------------
  ![](media/image36.png){width="3.682292213473316in"
  height="8.169265091863517in"}
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

*Figure 3.10.3: Create report screen of GreenMarket*

This screen allows the User to:

- Select violation type: choose the type of violation being reported.

- Provide report description: enter detailed information about the
  violation.

- Upload evidence: attach images as evidence for the report.

- Submit report: send the report to the moderation system for review.

  -----------------------------------------------------------------
  **Field       **Description**
  Name**        
  ------------- ---------------------------------------------------
  Loại vi phạm  Dropdown. Required. Select one violation type from
                predefined list.

  Mô tả chi     String, multiline, required. User description of
  tiết          the violation.

  Ảnh chứng cứ  Image upload, optional. Up to 5 images.

  Nút gửi báo   Action button. Submit the report to the system.
  cáo           
  -----------------------------------------------------------------

#### 3.10.4 Blocked Shops

  -----------------------------------------------------------------------
  ![](media/image21.png){width="3.9060028433945755in"
  height="8.619792213473316in"}
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

*Figure 3.10.4: Blocked shops screen of GreenMarket*

**This screen allows the User to:**

- **View blocked shops:** see the list of shops that the user has
  blocked.

- **Manage blocked shops:** remove a shop from the blocked list.

  -------------------------------------------------------------
  **Field /           **Description**
  Component**         
  ------------------- -----------------------------------------
  Danh sách shop đã   List of blocked shops associated with the
  chặn                user account.

  Tên shop            Display the name of the blocked shop.

  Nút "Bỏ chặn"       Action control to unblock the selected
                      shop.
  -------------------------------------------------------------

### 3.11 Settings

#### 3.11.1 Feedback

  -----------------------------------------------------------------------
  ![](media/image37.png){width="3.71792760279965in"
  height="8.181485126859142in"}
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

*Figure 3.11.1: Feedback screen of GreenMarket*

**This screen allows the User to:**

- **Submit feedback:** send feedback, bug reports, or inappropriate
  content reports.

- **Select feedback type:** choose the category of feedback.

- **Provide details:** describe the feedback content in text form.

  **Field name**       **Description**
  -------------------- ------------------------------------------------------------------------------------------------
  Loại phản hồi        Select option, required. Used to categorize feedback (bug, suggestion, inappropriate content).
  Nội dung phản hồi    Text, multiline, required. Detailed description of the feedback.
  Nút "Gửi phản hồi"   Action button, required. Submit feedback to the system.

#### 3.11.2 Notifications

  -----------------------------------------------------------------------
  ![](media/image46.png){width="3.8802088801399823in"
  height="8.552926509186351in"}
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

*Figure 3.11.2: Notifications screen of GreenMarket*

**This screen allows the User to:**

- **View notifications:** view the list of system notifications.

- **Identify unread notifications:** distinguish unread notifications
  from read ones.

- **Mark as read:** mark a notification as read.

- **Delete notification:** remove a notification from the list

  **Field name**          **Description**
  ----------------------- ----------------------------------------------------------------------------------------------
  Loại thông báo          String, label, required. Indicates notification type (system, order, moderation, promotion).
  Tiêu đề                 String, required. Short summary of the notification content.
  Nội dung                String, required. Detailed notification message.
  Thời gian               Datetime, required. Time when the notification was generated.
  Trạng thái đã đọc       Boolean, required. Indicates whether the notification has been read.
  Nút "Đánh dấu đã đọc"   Action button, optional. Mark the notification as read.
  Nút "Xóa"               Action button, optional. Delete the notification.

3.11.3 System Announcements

  -----------------------------------------------------------------------
  ![](media/image26.png){width="3.8281255468066493in"
  height="8.450382764654417in"}
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

*Figure 3.11.3: system announcements screen of GreenMarket*

**This screen allows the User to:**

- **View system announcements:** read official announcements from the
  system.

- **Stay updated:** check important updates, maintenance notices, and
  policy changes.

  ------------------------------------------------------
  **Field       **Description**
  name**        
  ------------- ----------------------------------------
  Tiêu đề       String, read-only. Announcement title.

  Nội dung      String, read-only. Announcement detailed
                content.

  Ngày thông    DateTime, read-only. Announcement
  báo           published date.
  ------------------------------------------------------

### 3.12 Shop

#### 3.12.1 Shop Detail

  -----------------------------------------------------------------------
  ![](media/image39.png){width="3.838542213473316in"
  height="8.508767497812773in"}
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

*Figure 3.12.1: shop detail screen of GreenMarket*

**This screen allows the User to:**

- **View shop information:** view shop name, rating, and address.

- **Follow shop:** follow a shop to receive updates on new listings.

- **Report shop:** report a shop for violations.

- **View shop listings:** browse all listings posted by the shop.

- **Navigate to listing detail:** access detail of a selected shop
  listing.

  ---------------------------------------------------------
  **Field     **Description**
  name**      
  ----------- ---------------------------------------------
  Tên cửa     String, read-only. Shop display name.
  hàng        

  Đánh giá    Number, read-only. Average shop rating.

  Địa chỉ     String, read-only. Shop location address.

  Theo dõi    Action button, optional. Follow or unfollow
              the shop.

  Báo cáo     Action button, optional. Submit a report for
              the shop.

  Tin đăng    Listing list, read-only. Display all posts
              created by the shop.
  ---------------------------------------------------------

#### 3.12.2 Shop Form

  -----------------------------------------------------------------------
  ![](media/image28.png){width="3.856486220472441in"
  height="8.567708880139982in"}
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

*Figure 3.12.2: shop information form screen of GreenMarket*

**This screen allows the User to:**

- **Create or update shop information:** enter and manage basic shop
  details.

- **Upload shop media:** upload shop logo or banner image.

- **Save or cancel changes:** submit or discard updated shop
  information.

  -------------------------------------------------------------
  **Field name**    **Description**
  ----------------- -------------------------------------------
  Tên shop          String, required. Shop display name.

  Số điện thoại     String, optional. Contact phone number for
  liên hệ           the shop.

  Địa chỉ           String, optional. Shop location selected by
                    the user.

  Mô tả             String, optional. Short description about
                    the shop.

  Upload logo /     File upload, optional. Upload shop logo or
  banner            banner image.

  Lưu               Action button, required. Save shop
                    information changes.

  Hủy               Action button, optional. Cancel and discard
                    changes.
  -------------------------------------------------------------

#### 3.12.3 Shop Search

  -----------------------------------------------------------------------
  ![](media/image19.png){width="3.8521806649168853in"
  height="8.505208880139982in"}
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

*Figure 3.12.3: shop search screen of GreenMarket*

**This screen allows the User to:**

- **Search shops:** search shops by name keyword.

- **Filter shops:** filter shop list by location and rating.

- **View shop summary:** view basic information of available shops.

- **Navigate to shop detail:** access detail of a selected shop.

  **Field name**       **Description**
  -------------------- -----------------------------------------------------------------------------
  Tìm theo tên shop    String, optional. Keyword input for shop name search.
  Địa điểm             Filter option, optional. Filter shops by selected location.
  Rating               Filter option, optional. Filter shops by rating level.
  Danh sách cửa hàng   Listing list, read-only. Display shops matching search and filter criteria.

### 3.13 Promotions

#### 3.13.1 Promotion Packages Screen

  --------------------------------------------------------------------
  ![](media/image59.png){width="3.886557305336833in"
  height="8.619792213473316in"}
  --------------------------------------------------------------------

  --------------------------------------------------------------------

*Figure 3.13.1: Promotion Packages list screen of GreenMarket*

This screen allows the User to:

- View all available promotion packages.

- Compare package information including name, slot position, duration,
  and price.

- Select a package to purchase.

  **Field name**       **Description**
  -------------------- ----------------------------------------------------------------------------------
  **Tên gói**          String. Display name of the promotion package.
  **Mô tả (inline)**   String. Short description of the promotion package shown under the package name.
  **Vị trí**           String/Number. Slot or placement position of the promotion package.
  **Thời hạn**         String. Duration of the promotion package.
  **Giá (VND)**        Number. Price of the package in VND, displayed with thousand separators.
  **Hành động**        Column containing the action button for package selection.
  **Mua ngay**         Action button. Navigates to purchase flow for the selected package.

#### 3.13.2 Purchase Package

+--------------------------------------------------------------------+
| ![](media/image75.png){width="3.7536023622047243in"                |
| height="8.35937554680665in"}                                       |
|                                                                    |
| ![](media/image58.png){width="3.807292213473316in"                 |
| height="8.528333333333334in"}                                      |
+====================================================================+

*Figure 3.13.2: Purchase promotion package screen of GreenMarket*

This screen allows the User to:

- View promotion package details including placement, duration, and
  price.

- Confirm payment using a simulated MoMo Sandbox environment.

- Complete the purchase flow and receive confirmation.

- Navigate to boosted posts or return to the Home screen after
  successful payment.

  **Field name**                      **Description**
  ----------------------------------- ---------------------------------------------------------------------------------
  **Tên gói**                         String. Display name of the selected promotion package.
  **Vị trí hiển thị**                 String/Number. Placement slot of the promotion package.
  **Thời hạn**                        String. Valid duration of the promotion package.
  **Tổng cộng**                       Number. Total price of the package shown in VND with thousand separators.
  **MoMo (GIẢ LẬP)**                  Informational section. Indicates that payment is simulated in sandbox mode.
  **Thanh toán (button)**             Action button, required. Initiates payment simulation for the selected package.
  **Đang xử lý...**                   Processing state. Displayed while the payment simulation runs.
  **Thanh toán thành công**           Confirmation message shown after payment simulation completes.
  **Xem tin đã đẩy**                  Action button. Navigates to the "My Boosts" screen after successful payment.
  **Quay về Trang chủ**               Action button. Returns the User to the Home screen.
  **Không tìm thấy gói khuyến mãi**   Error state displayed when the package ID is invalid or unavailable.

#### 3.13.3 Boost Post

  --------------------------------------------------------------------
  ![](media/image47.png){width="3.8593755468066493in"
  height="8.566178915135609in"}
  --------------------------------------------------------------------

  --------------------------------------------------------------------

*Figure 3.13.3: Assign promotion package to a Bonsai post screen of
GreenMarket*

This screen allows the User to:

- Select one of their existing Bonsai posts to boost.

- Select an active promotion package to apply.

- Submit the boost request and immediately push the post to the selected
  position.

- Cancel the action and return to the previous screen.

  **Field name**                  **Description**
  ------------------------------- ----------------------------------------------------------------------------------
  **Chọn cây cảnh cần đẩy tin**   Dropdown, required. Allows the user to select one of their own Bonsai posts.
  **Chọn gói đang hoạt động**     Dropdown, required. Allows the user to select an active promotion package.
  **Thông báo hướng dẫn**         Info box. Explains that the selected post will be boosted immediately.
  **Xác nhận đẩy tin Bonsai**     Action button, required. Submits the boost request for the selected post.
  **Hủy bỏ**                      Action button, optional. Cancels the operation and returns to the previous page.

#### 3.13.4 My Boosts

  --------------------------------------------------------------------
  ![](media/image2.png){width="3.8354822834645668in"
  height="8.505208880139982in"}
  --------------------------------------------------------------------

  --------------------------------------------------------------------

*Figure 3.13.4: User's active and past boosted posts screen of
GreenMarket*

This screen allows the User to:

- View all posts that are currently being boosted or have been boosted
  before.

- See boost details such as applied package, display slot, and time
  period.

- Cancel an active boost, returning the post to its normal ranking.

- Review expired or inactive boosts.

  **Field name**                             **Description**
  ------------------------------------------ --------------------------------------------------------------------
  **Tiêu đề bài đăng**                       String. Title of the Bonsai post that is being boosted.
  **Trạng thái Boost**                       Enum. Indicates whether the boost is:
                                             • *Đang hoạt động* -- active boost
                                             • *Đã kết thúc* -- expired boost
  **Gói áp dụng**                            String. Name of the promotion package being applied to the post.
  **Vị trí hiển thị**                        Number/String. Display slot assigned by the package.
  **Thời hạn**                               Date Range. The start and end date of the boost.
  **Hủy & Ngừng đẩy tin**                    Action button, conditional. Appears only when the boost is active.
                                             Allows the user to cancel the boost early.
  **Không tìm thấy tin nào đang được đẩy**   Empty state message shown when the user has no active boosts.

#### 3.13.5 Transaction History

  --------------------------------------------------------------------
  ![](media/image23.png){width="3.7858475503062117in"
  height="8.369792213473316in"}
  --------------------------------------------------------------------

  --------------------------------------------------------------------

*Figure 3.13.5: User's transaction history screen of GreenMarket*

This screen allows the User to:

- View all wallet/account-related transactions in chronological order.

- Check the amount of each transaction, whether it is a credit (+) or
  debit (--).

- Review transaction details such as description, date, and status.

- Identify pending or completed transactions easily through color-coded
  labels.

  **Field name**               **Description**
  ---------------------------- ------------------------------------------------------------------------------------------------------------------------------------------------------
  **Mô tả giao dịch**          String. Title/description of the transaction (e.g., nạp tiền, thanh toán gói đẩy tin, hoàn tiền).
  **Số tiền**                  Number. Transaction amount shown with thousands separators. • Hiển thị màu xanh và có dấu "+" nếu là **credit**. • Hiển thị màu đỏ nếu là **debit**.
  **Loại giao dịch**           Enum. Indicates whether the transaction is: • **credit** -- tiền vào • **debit** -- tiền ra
  **Ngày giao dịch**           Date String. The date when the transaction occurred.
  **Trạng thái giao dịch**     Enum. Indicates whether the transaction is: • **Thành công** -- success • **Đang xử lý** -- pending
  **Không có giao dịch nào**   Empty state message shown when the User has no transaction history.

### 3.14 Analytics

#### 3.14.1 AI Recommendations

  --------------------------------------------------------------------
  ![](media/image64.png){width="3.6918755468066493in"
  height="8.39062554680665in"}
  --------------------------------------------------------------------

  --------------------------------------------------------------------

*Figure 3.14.1: AI Bonsai recommendation and suggestion history screen
of GreenMarket*

This screen allows the User to:

- View the latest AI recommendation for improving visibility or boosting
  a Bonsai post.

- Apply the suggested "Đẩy tin" (Boost) flow directly from this
  recommendation.

- Review past AI-generated recommendations in a chronological list.

- Understand the context (date, system source) of each AI suggestion.

- If the User has no AI recommendations available, the screen displays
  an empty-state message.

  ----------------------------------------------------------------------
  **Field name**   **Description**
  ---------------- -----------------------------------------------------
  **Khuyến nghị    String. The latest AI-generated recommendation
  mới nhất**       content for boosting or caring for a Bonsai post.
                   Displayed prominently at the top of the screen.

  **Ngày cập       Date. Timestamp showing when the latest
  nhật**           recommendation was generated.

  **Nút "Áp dụng   Action button. Allows the User to immediately start a
  đẩy tin          boost workflow based on the AI recommendation.
  Bonsai"**        

  **Lịch sử tư vấn List. Previous AI recommendations shown in descending
  AI**             chronological order (newest first).

  **Thời gian tư   Date. When the AI generated the specific
  vấn**            recommendation.

  **Nguồn tư vấn** Enum/String. Always displayed as "CHUYÊN GIA BONSAI
                   AI" to indicate system-generated advice.

  **Nội dung tư    String. AI-generated message describing the
  vấn**            recommended action or observation.

  **Không có gợi ý Empty-state message. Displayed when there are no past
  từ AI**          or present recommendations.
  ----------------------------------------------------------------------

#### 3.14.2 Post Analytics

  --------------------------------------------------------------------
  ![](media/image44.png){width="2.997330489938758in"
  height="6.658499562554681in"}
  --------------------------------------------------------------------

  --------------------------------------------------------------------

*Figure 3.14.2: Post performance analytics screen of GreenMarket*

This screen allows the User to:

- View performance metrics of a selected Bonsai post.

- Switch between 7-day and 30-day performance ranges.

- Monitor impressions, clicks, contact interactions, and CTR.

- Observe daily view trends through a bar-style trend graph.

- Identify recommended \"golden hours\" for posting to maximize
  visibility.

- Review the post ID for context.

- If no performance data exists, an empty-state message is displayed.

  **Field name**                            **Description**
  ----------------------------------------- ------------------------------------------------------------------------------------------------------------------------------------------------
  **ID bài viết**                           String. The identifier of the Bonsai post being analyzed.
  **Bộ lọc thời gian (7 ngày / 30 ngày)**   Toggle buttons. Allows the User to switch between different time ranges for performance analytics.
  **Lượt hiển thị**                         Number. The total number of times the post appeared to viewers.
  **Lượt nhấp**                             Number. The number of times users clicked on the post.
  **Tỉ lệ nhấp (CTR)**                      Percentage. Calculated as clicks divided by impressions.
  **Lượt liên hệ**                          Number. Number of users who tapped the contact button on the post.
  **Xu hướng lượt xem (biểu đồ)**           Bar chart. Displays daily views within the selected time range. Each bar represents one day.
  **Ngày trong biểu đồ**                    String. Labels showing the days corresponding to each bar in the trend chart.
  **Giờ vàng đăng bài**                     List of Time Strings. Recommended time slots that historically generate the highest engagement for this post. Displayed as highlighted badges.
  **Không có dữ liệu hiệu suất**            Empty-state message. Shown when there is no performance data for the selected post.

### 3.15 Admin Web

#### 3.15.1 System Analytics (Admin)

  --------------------------------------------------------------------
  ![](media/image74.png){width="6.135416666666667in"
  height="2.986111111111111in"}
  --------------------------------------------------------------------

  --------------------------------------------------------------------

*Figure 3.13.1: system analytics screen of GreenMarket (Admin)*

**This screen allows the Admin to:**

- **View system analytics:** monitor overall system performance and
  statistics.

- **Filter analytics data:** view analytics by category and date range.

- **Analyze trends:** review visualized data through charts.

- **Export reports:** export analytics data for reporting or auditing
  purposes.

  **Field name**     **Description**
  ------------------ ------------------------------------------------------------------------------
  Loại thống kê      Enum (Overview, Posts, Users, Revenue), required. Select analytics category.
  Ngày bắt đầu       Date, optional. Start date for analytics filtering.
  Ngày kết thúc      Date, optional. End date for analytics filtering.
  Biểu đồ thống kê   Chart view, read-only. Display analytics data visually.
  Export             Action button, optional. Export analytics data to file.

#### 3.15.2 Attribute Management (Admin)

  --------------------------------------------------------------------
  ![](media/image68.png){width="6.135416666666667in"
  height="2.9722222222222223in"}
  --------------------------------------------------------------------

  --------------------------------------------------------------------

*Figure 3.13.2: attribute management screen of GreenMarket (Admin)*

**This screen allows the Admin to:**

- **View attributes:** view the list of all system attributes.

- **Create attribute:** create a new attribute for product or listing
  classification.

- **Edit attribute:** update attribute information and configuration.

- **Disable attribute:** disable an attribute from being used in the
  system.

- **Review attribute usage:** see where each attribute is applied.

  ----------------------------------------------------------------
  **Field       **Description**
  name**        
  ------------- --------------------------------------------------
  Name          String, read-only. Attribute display name.

  Type          Enum, read-only. Attribute data type (e.g. text,
                number, select).

  Used In       List of String, read-only. Categories or modules
                using the attribute.

  Create        Action button, optional. Navigate to create
  Attribute     attribute screen.

  Edit          Action button, optional. Edit selected attribute
                information.

  Disable       Action button, optional. Disable selected
                attribute from active use.
  ----------------------------------------------------------------

#### 

**3.13.3 Attribute Create /Edit**

  --------------------------------------------------------------------
  ![](media/image66.png){width="6.135416666666667in"
  height="2.986111111111111in"}
  --------------------------------------------------------------------

  --------------------------------------------------------------------

*Figure 3.13.3: create / edit attribute screen of GreenMarket (Admin)*

**This screen allows the Admin to:**

- **Create attribute:** define a new attribute for listings or products.

- **Edit attribute:** update existing attribute configuration.

- **Configure attribute behavior:** set required and filterable
  properties.

- **Manage attribute options:** define selectable values for select-type
  attributes.

  --------------------------------------------------------------------
  **Field      **Description**
  name**       
  ------------ -------------------------------------------------------
  Attribute    String, required. Attribute display name.
  name         

  Type         Enum (Text, Number, Select), required. Attribute data
               type.

  Options      List of String, optional. Selectable values, applicable
               only for select type.

  Required     Boolean, optional. Mark attribute as mandatory when
               creating listings.

  Filterable   Boolean, optional. Allow attribute to be used in search
               filters.

  Save         Action button, required. Save attribute configuration.
  --------------------------------------------------------------------

#### 3.15.4 Admin Login

  --------------------------------------------------------------------
  ![](media/image13.png){width="6.135416666666667in"
  height="2.9722222222222223in"}
  --------------------------------------------------------------------

  --------------------------------------------------------------------

*Figure 3.13.4: admin login screen of GreenMarket*

**This screen allows the Admin to:**

- **Authenticate admin account:** log in using admin credentials.

- **Access admin system:** enter the admin dashboard after successful
  authentication.

  -----------------------------------------------------------------
  **Field    **Description**
  name**     
  ---------- ------------------------------------------------------
  Username   String, required. Admin account username.

  Password   String, masked, required. Admin account password.

  Login      Action button, required. Authenticate admin
             credentials and log in.

  Admin note Text, read-only. Inform that the page is restricted to
             administrators only.
  -----------------------------------------------------------------

#### 

#### 

#### 3.15.5 Category Management (List)

  --------------------------------------------------------------------
  ![](media/image51.png){width="6.135416666666667in"
  height="2.986111111111111in"}
  --------------------------------------------------------------------

  --------------------------------------------------------------------

*Figure 3.13.5: category management screen of GreenMarket (Admin)*

**This screen allows the Admin to:**

- View all categories in the system.

- Search categories by name.

- Identify category status (Active / Disabled).

- Create new categories.

- Edit existing categories.

- Disable categories without deleting historical data.

  --------------------------------------------------------
  **Component**   **Description**
  --------------- ----------------------------------------
  Category list   Display all categories with name and
                  status.

  Category status Show whether the category is Active or
                  Disabled.

  Search category Text input to filter categories by name.

  Add Category    Action button to navigate to Create
                  Category screen.

  Edit            Action button to navigate to Edit
                  Category screen.

  Disable         Action button to deactivate a category.
  --------------------------------------------------------

#### 3.15.6 Category Create / Edit

  --------------------------------------------------------------------
  ![](media/image41.png){width="6.135416666666667in"
  height="2.9722222222222223in"}
  --------------------------------------------------------------------

  --------------------------------------------------------------------

*Figure 3.13.6: create / edit category screen of GreenMarket (Admin)*

**This screen allows the Admin to:**

- **Create category:** define a new category for organizing listings.

- **Edit category:** update category information and hierarchy.

- **Manage category hierarchy:** assign parent category to build a tree
  structure.

- **Control category visibility:** activate or deactivate categories.

  -------------------------------------------------------------------
  **Field       **Description**
  name**        
  ------------- -----------------------------------------------------
  Name          String, required. Display name of the category.

  Slug          String, required. URL-friendly unique identifier.

  Icon          String, optional. Icon name or icon reference for UI
                display.

  Parent        Category reference, optional. Define category
  category      hierarchy (Root if none).

  Active        Boolean, optional. Control whether the category is
                visible to users.

  Save          Action button, required. Save category information.

  Cancel        Action button, optional. Discard changes and return
                to category list.
  -------------------------------------------------------------------

#### 3.15.7 Data Export

  --------------------------------------------------------------------
  ![](media/image27.png){width="6.135416666666667in"
  height="2.986111111111111in"}
  --------------------------------------------------------------------

  --------------------------------------------------------------------

*Figure 3.13.7: data export screen of GreenMarket (Admin)*

**This screen allows the Admin to:**

- Select system data to export.

- Filter data by date range.

- Choose export file format.

- Download exported data for reporting or backup purposes.

  **Field name**       **Description**
  -------------------- -----------------------------------------------------------------------------
  Data type selector   Dropdown to select the type of data to export (Users, Posts, Transactions).
  Date range           Start date and end date inputs to filter exported data.
  File format          Dropdown to select export format (CSV, Excel).
  Download button      Trigger data export and file download.

#### 3.15.8 Category -- Attribute Mapping

  --------------------------------------------------------------------
  ![](media/image38.png){width="6.135416666666667in"
  height="2.9722222222222223in"}
  --------------------------------------------------------------------

  --------------------------------------------------------------------

*Figure 3.13.8: category attribute mapping screen of GreenMarket
(Admin)*

**This screen allows the Admin to:**

- Select a product category.

- View attributes assigned to the selected category.

- Add new attributes to a category.

- Remove attributes from a category.

- Configure attribute rules (e.g. required or optional).

  **Field name**             **Description**
  -------------------------- --------------------------------------------------------------------------
  Category list              Displays all available categories. Admin selects one category at a time.
  Assigned attributes list   Shows attributes currently mapped to the selected category.
  Remove attribute           Allows admin to detach an attribute from the category.
  Set required               Allows admin to mark an attribute as required for that category.
  Add attribute button       Opens attribute selection modal to assign new attributes.

#### 

#### 3.15.9 Template Management

  --------------------------------------------------------------------
  ![](media/image12.png){width="6.135416666666667in" height="3.0in"}
  --------------------------------------------------------------------

  --------------------------------------------------------------------

*Figure 3.13.9: Template management screen of GreenMarket (Admin)*

This screen allows the Admin to:

- View all available templates.

- Create a new template.

- Edit an existing template.

- Clone an existing template.

- Disable a template.

  **Field name**           **Description**
  ------------------------ -------------------------------------------------------------------------
  Template list            Displays all existing templates along with their associated categories.
  Template name            Shows the name of the template.
  Category                 Indicates the category to which the template belongs.
  Create Template button   Allows the Admin to create a new template.
  Edit button              Opens the template edit screen to modify template details.
  Clone button             Creates a duplicate of the selected template for faster setup.
  Disable button           Disables the selected template, making it unavailable for use.

#### 

#### 3.15.10 Template Builder

  --------------------------------------------------------------------
  ![](media/image15.png){width="6.135416666666667in"
  height="2.986111111111111in"}
  --------------------------------------------------------------------

  --------------------------------------------------------------------

*Figure 3.13.10: Template builder screen of GreenMarket (Admin)*

**This screen allows the Admin to:**

- Design a template by adding form fields.

- Choose field types for the template.

- Configure the structure of a template.

- Preview the template layout in real time.

  -------------------------------------------------------------
  **Field name**  **Description**
  --------------- ---------------------------------------------
  Form Builder    Displays tools for building and configuring
  panel           template fields.

  Add Field       Allows the Admin to add a new field to the
  button          template.

  Text button     Adds a text-type field to the template.

  Number button   Adds a numeric field to the template.

  Select button   Adds a selectable (dropdown) field to the
                  template.

  Preview panel   Shows a live preview of the template as it is
                  being built.

  Preview field   Displays a sample representation of the added
                  fields.
  -------------------------------------------------------------

#### 

#### 3.15.11 User List

  --------------------------------------------------------------------
  ![](media/image7.png){width="6.135416666666667in"
  height="2.986111111111111in"}
  --------------------------------------------------------------------

  --------------------------------------------------------------------

*Figure 3.13.11: User list screen of GreenMarket (Admin)*

This screen allows the Admin to:

- View all users registered in the system.

- Search users by name or phone number.

- View each user's assigned roles.

- Monitor current account status (Active / Locked).

- Perform user-related actions such as managing roles, locking/unlocking
  the user, or viewing user details.

  **Field name**             **Description**
  -------------------------- --------------------------------------------------------------------------------------------------------------
  **Search user**            Input field. Allows the Admin to filter users by name or phone number.
  **Name**                   Displays the user\'s full name.
  **Phone**                  Shows the registered phone number of the user.
  **Roles**                  List of assigned roles (e.g., Buyer, Seller, Admin). Multiple roles are displayed as comma-separated values.
  **Status**                 Shows whether the user is **Active** or **Locked**. Color-coded badge: green for Active, red for Locked.
  **Manage Roles button**    Opens a role-management dialog allowing the Admin to add or remove roles for the selected user.
  **Lock / Unlock button**   Toggles the user's status. "Lock" turns the account into Locked; "Unlock" reactivates it.
  **View button**            Opens the detailed user profile page.
  **User table**             Displays all user entries in a tabular layout.
  **User list container**    The main content area containing search input and the user table.

#### 3.15.12 User Detail

  --------------------------------------------------------------------
  ![](media/image72.png){width="6.135416666666667in"
  height="2.986111111111111in"}
  --------------------------------------------------------------------

  --------------------------------------------------------------------

*Figure 3.13.12: User detail management screen of GreenMarket (Admin)*

This screen allows the Admin to:

- View full information of a selected user.

- Review the user\'s phone number and basic profile details.

- Manage assigned roles using checkboxes.

- Activate or lock the user account.

- Save role changes.

  **Field name**              **Description**
  --------------------------- ---------------------------------------------------------------------------------------------------------------------------
  **Tên**                     String. The full name of the selected user.
  **Số điện thoại**           String. The user's registered phone number.
  **Roles section**           A list of available system roles (e.g., ADMIN, MOD). Each role is represented as a checkbox for assignment.
  **ADMIN checkbox**          Boolean. Assigns or removes the ADMIN role for the user.
  **MOD checkbox**            Boolean. Assigns or removes the MOD role for the user.
  **Save button**             Saves all updates to the user's roles.
  **Lock Account button**     Locks the user's account, preventing login. This button may toggle to **Unlock Account** if the user is currently locked.
  **User detail container**   The main layout that groups user info, roles, and available actions.

#### 3.15.13 Activity Log

  --------------------------------------------------------------------
  ![](media/image80.png){width="6.135416666666667in"
  height="2.986111111111111in"}
  --------------------------------------------------------------------

  --------------------------------------------------------------------

*Figure 3.13.13: Activity log monitoring screen of GreenMarket (Admin)*

This screen allows the Admin to:

- View the full history of system and moderator actions.

- Track who performed an action, when it occurred, and which post was
  affected.

- Review details of moderation activities such as approvals, removals,
  expirations, and automated tasks

- Monitor actions from both humans (Admin/MOD) and automated system
  agents (e.g., hethong_bot).

- Audit changes for transparency and quality control.

  **Field name**           **Description**
  ------------------------ ----------------------------------------------------------------------------------------------
  **Thời gian**            Date/Time. When the action occurred. Displayed in dd/MM/yyyy HH:mm format.
  **Người thực hiện**      String. Username of the admin, moderator, or system bot that executed the action.
  **Hành động**            String. The type of activity performed (e.g., Duyệt bài đăng, Gỡ bài viết, Tự động Hết hạn).
  **Đối tượng tin đăng**   String. Title of the Bonsai post affected by the action.
  **Chi tiết xử lý**       String. Additional information explaining why the action happened or what rule was applied.
  **Log entry row**        Represents one activity record containing all associated fields.
  **Activity table**       Displays all logs in chronological or reverse-chronological format.
  **Empty state**          Message shown when the system has no logged activities.

#### 3.15.14 Admin Dashboard

  --------------------------------------------------------------------
  ![](media/image43.png){width="6.135416666666667in"
  height="2.986111111111111in"}
  --------------------------------------------------------------------

  --------------------------------------------------------------------

*Figure 3.13.14: Overview dashboard screen of GreenMarket (Admin)*

This screen allows the Admin to:

- View key statistics including total users, total posts, total revenue,
  and current system health status.

- Monitor the overall performance and workload of the GreenMarket
  platform.

- Refresh the metrics to fetch the latest real-time updated data.

- Detect anomalies early, such as sudden drops in user activity,
  unexpected increases in post volume, or system health warnings.

  **Field name**        **Description**
  --------------------- -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Users**             Number. Total number of registered user accounts in the system. Pulled from the admin metrics API.
  **Posts**             Number. Total number of active posts currently available on the marketplace, including bonsai listings and promotional posts.
  **Revenue**           Number/String. Total revenue generated by the platform (e.g., premium posts, subscriptions, ads). Displayed as a numeric value or currency format depending on configuration.
  **System**            String. Indicates the current system health status (e.g., *OK*, *Degraded*, *Critical*). Used to monitor overall operational stability.
  **Dashboard cards**   A group of metric boxes summarizing the platform's key performance indicators (KPIs). Displays Users, Posts, Revenue, and System Health.
  **Refresh button**    Action. Fetches the latest metrics from the server and updates all dashboard values in real time.

#### 

#### 3.15.15 Placement Slot Management

  --------------------------------------------------------------------
  ![](media/image22.png){width="6.135416666666667in"
  height="2.986111111111111in"}
  --------------------------------------------------------------------

  --------------------------------------------------------------------

*Figure 3.15.15: Placement slot management screen of GreenMarket
(Admin)*

This screen allows the Admin to:

- Manage all premium or highlighted placement slots used to display
  promoted posts across the platform.

- View the list of available display positions including homepage top,
  category header, and search-boost areas.

- Review slot configuration such as capacity and display rotation rules.

- Edit existing placement slots or create new ones.

- Control how many posts can appear in each slot and how they rotate or
  prioritize.

  **Field name**         **Description**
  ---------------------- ----------------------------------------------------------------------------------------------------------------------------------
  **Tên vị trí**         String. The display slot name (e.g., Đầu Trang chủ, Đầu Danh mục, Đẩy tin Tìm kiếm). Describes where promoted posts will appear.
  **Sức chứa**           Number. Maximum number of posts that can appear in the slot at any given time.
  **Quy tắc hiển thị**   String. Defines how posts are rotated or prioritized (e.g., Xoay vòng, Ưu tiên đăng ký trước, Ngẫu nhiên).
  **Hành động**          Action column. Allows the Admin to edit the configuration of a placement slot.
  **Add Slot button**    Action. Opens a form to create a new placement slot with name, capacity, and display rule.
  **Slot row**           Represents a single slot entry containing its name, capacity, display rule, and available actions.
  **Placement table**    Table listing all existing placement slots in the system.
  **Empty state**        Shown when no placement slots have been configured yet.

#### 

#### 3.15.16 Promotion Package Management

  --------------------------------------------------------------------
  ![](media/image45.png){width="6.135416666666667in"
  height="2.986111111111111in"}
  --------------------------------------------------------------------

  --------------------------------------------------------------------

*Figure 3.15.16: Promotion package management screen of GreenMarket
(Admin)*

This screen allows the Admin to:

- Manage all promotional packages available for users to purchase (e.g.,
  tin VIP, vị trí nổi bật).

- View package attributes including display slot, duration, price, and
  status.

- Create new promotional packages for marketing strategies or seasonal
  campaigns.

- Edit existing packages, update pricing, modify duration, or adjust
  assigned placement slots.

- Enable or disable a package from being sold to users.

- Oversee the monetization structure of posts promoted on the
  GreenMarket platform.

  **Field name**      **Description**
  ------------------- ---------------------------------------------------------------------------------------------------------------------------
  **Tên gói**         String. The name of the promotion package (e.g., VIP 7 ngày, Đẩy tin danh mục).
  **Vị trí**          String. The display slot where the promoted post will appear (e.g., Đầu Trang chủ, Đẩy tin Tìm kiếm).
  **Thời hạn**        String/Number. Duration of the package (e.g., 3 ngày, 7 ngày, 30 ngày). Determines how long the promotion remains active.
  **Giá (VND)**       Number. The selling price of the package in Vietnamese đồng. Displayed with thousands separators for readability.
  **Trạng thái**      String. Current selling status of the package (e.g., *Đang bán*, *Ngừng bán*). Controls whether users can purchase it.
  **Hành động**       Column containing actions for Admin: edit package details or disable sales.
  **"Tạo gói mới"**   Button. Opens a form to create a new promotion package including name, slot, duration, and price.
  **Package row**     Represents a single promotion package entry with all its attributes.
  **Package table**   Table listing all promotion packages registered in the system.
  **Empty state**     Shown when no promotion packages are available.

#### 

#### 3.15.17 Boosted Posts Management

  --------------------------------------------------------------------
  ![](media/image49.png){width="6.135416666666667in"
  height="2.9722222222222223in"}
  --------------------------------------------------------------------

  --------------------------------------------------------------------

*Figure 3.15.17: Boosted posts management screen of GreenMarket (Admin)*

This screen allows the Admin to:

- View all promoted (boosted) posts from every user on the platform.

- Monitor which posts are currently being boosted and which boosts have
  expired.

- Check placement slot, duration, and policies applied to each boost.

- Audit promotion activity to ensure fair placement and prevent abuse.

- Identify problematic boosts (e.g., banned posts still being boosted).

- Track promotion history for transparency and billing validation.

  **Field name**           **Description**
  ------------------------ -------------------------------------------------------------------------------------------------------------------
  **Mã bài viết**          String. Unique identifier of the boosted post. Used for tracing content, billing, and resolving disputes.
  **Người dùng**           String. Username or account ID of the user who purchased the boost.
  **Vị trí**               String. The display slot where the post is boosted (e.g., Đầu Trang chủ, Đẩy tin Tìm kiếm).
  **Thời gian hiển thị**   Date Range. The boost\'s active duration in **start → end** format (dd/MM/yyyy).
  **Trạng thái**           Enum. Status of the boost: • **Đang hoạt động** -- currently boosted• **Đã kết thúc** -- promotion period is over
  **Chính sách áp dụng**   String. The display or rotation policy applied to the boost (e.g., Mặc định, Xoay vòng, Ưu tiên đăng ký trước).
  **Boost row**            Represents a single entry containing all data for one boosted post.
  **Boost table**          Displays all boosted posts in a structured table. Used for platform-wide promotion supervision.
  **Empty state**          Shown when no posts have been boosted on the platform.

#### 

#### 3.15.18 AI Insights & Recommendation Settings

  --------------------------------------------------------------------
  ![](media/image61.png){width="6.135416666666667in"
  height="2.986111111111111in"}
  --------------------------------------------------------------------

  --------------------------------------------------------------------

*Figure 3.15.18: AI insights and recommendation configuration screen of
GreenMarket (Admin)*

This screen allows the Admin to:

- View AI-generated market insights summarizing current bonsai trends,
  keywords, and slot usage.

- Refresh the AI summary to obtain updated, real-time market
  intelligence.

- Configure the AI recommendation engine, including enabling/disabling
  AI, selecting data sources, and defining prompt instructions.

- Adjust how the AI analyzes user behavior, search trends, and bonsai
  market movements.

- Maintain control over the system's suggestion logic to optimize
  accuracy and business outcomes.

  **Field name**                           **Description**
  ---------------------------------------- -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Tóm tắt thị trường Bonsai**            Section. Displays the AI-generated market summary (UC97). Provides trends, keyword spikes, and recommendations for Admin decision-making.
  **Bản tóm tắt thị trường**               Text/Paragraph. The actual AI-generated insight. Includes trending bonsai types, search increases, slot capacity usage, and revenue suggestions.
  **Làm mới tóm tắt**                      Button. Requests the AI engine to regenerate a new market summary with the latest data.
  **Cấu hình Thuật toán Gợi ý**            Section for AI recommendation settings (UC98). Allows Admin to control how the AI behaves and what data it uses.
  **Kích hoạt AI hỗ trợ người chơi cây**   Checkbox. Enables or disables the AI recommendation engine entirely. If disabled, users will not receive AI-based suggestions.
  **Nguồn dữ liệu phân tích**              Dropdown. Allows the Admin to select which datasets the AI should use (internal system data, national bonsai associations, social media trends, etc.).
  **Câu lệnh điều hướng AI (Prompt)**      Textarea. The instruction template used to guide AI behavior. Admin can customize how AI should interpret keywords, bonsai types, pricing, and promotional recommendations.
  **Lưu cấu hình AI**                      Button. Saves all AI configuration changes to the system and updates the behavior of the AI recommendation engine.
  **AI Insight card**                      Container displaying the generated insights and actions related to AI summaries.
  **AI Configuration card**                Container showing all configurable fields related to AI behavior and data sources.
  **Empty state (optional)**               If AI has not generated any summary yet, the interface displays a placeholder message instead of a market report.

#### 3.15.19 System Settings

  --------------------------------------------------------------------
  ![](media/image3.png){width="6.135416666666667in"
  height="2.986111111111111in"}
  --------------------------------------------------------------------

  --------------------------------------------------------------------

*Figure 3.15.19: System configuration screen of GreenMarket (Admin)*

This screen allows the Admin to:

- Manage global system rules affecting posting, content validation, and
  operational modes.

- Configure platform-level limitations such as image limits, post rate
  limits, and lifecycle rules.

- Toggle sandbox/testing modes for OTP or other system functions.

- Manage prohibited keywords used for basic content filtering.

- Define lifecycle rules determining how long posts remain active and
  how long they stay in trash before deletion.

- Ensure stable system operations through clear, centralized
  configuration controls.

  **Field name**                                **Description**
  --------------------------------------------- ------------------------------------------------------------------------------------------------------------------------------------
  **Cấu hình chung**                            **Section.** Contains global system settings such as sandbox mode, upload limits, and posting limits.
  **Chế độ thử nghiệm OTP (Sandbox)**           **Checkbox.** Enables or disables OTP sandbox mode. When enabled, OTP verification uses test values instead of real SMS providers.
  **Số lượng ảnh tối đa mỗi bài viết**          **Number input.** Defines how many images a user may upload per post. Used for performance and storage control.
  **Giới hạn bài đăng (mỗi giờ)**               **Number input.** Defines the maximum number of posts a user can create per hour. Helps prevent spam.
  **Cập nhật cấu hình**                         **Button.** Saves all general configuration changes in this section.
  **Từ khóa bị cấm**                            **Section.** Lists prohibited keywords used in content scanning to block spam, illegal content, or harmful terms.
  **Danh sách từ khóa bị cấm**                  **Textarea.** Contains a comma-separated list of all restricted keywords. Admin can add/remove keywords as needed.
  **Lưu từ khóa**                               **Button.** Saves updates to the prohibited keyword list into the system.
  **Quy tắc Vòng đời bài viết**                 **Section.** Defines how posts expire, how long they remain active, and how trash cleanup works.
  **Tự động hết hạn sau (ngày)**                **Number input.** Determines how long a post stays active before automatically expiring.
  **Thời gian khôi phục từ thùng rác (ngày)**   **Number input.** Determines how long a deleted post remains in trash before permanent removal.
  **Áp dụng quy tắc**                           **Button.** Saves lifecycle settings and applies them to future and existing posts.
  **General Settings card**                     **Container displaying all global configuration fields**, including upload limits, sandbox toggles, and posting rules.
  **Keyword Filtering card**                    **Container holding the prohibited keywords textarea and related actions.**
  **Post Lifecycle card**                       **Container containing lifecycle rule fields and apply button.**
  **Empty state (optional)**                    If no configuration has been set yet, the interface displays default placeholder values until Admin saves new settings.

#### 3.15.20 Bonsai Post Form Preview

  --------------------------------------------------------------------
  ![](media/image69.png){width="6.135416666666667in"
  height="2.986111111111111in"}
  --------------------------------------------------------------------

  --------------------------------------------------------------------

*Figure 3.15.20: Bonsai posting form preview screen of GreenMarket
(Admin)*

This screen allows the Admin to:

- Preview the Bonsai-specific posting form before releasing it to users.

- Verify that the UI elements, labels, placeholders, and domain-specific
  fields for the Bonsai category are properly structured.

- Ensure that required attributes such as tree shape, pot type, and age
  estimation follow industry standards.

- Simulate the user experience when posting a Bonsai listing without
  allowing real submission.

- Review how category-specific rules and fields appear in the final
  posting interface.

  **Field name**                          **Description**
  --------------------------------------- ------------------------------------------------------------------------------------------------------------------------------------
  **Tiêu đề tin**                         **Text input.** Title of the Bonsai listing. Placeholder suggests typical naming patterns such as tree type + age.
  **Danh mục**                            **Dropdown (disabled).** Preselected as "Cây cảnh & Bonsai" to indicate this preview is locked to the Bonsai category.
  **Thuộc tính đặc thù ngành Cây cảnh**   **Section.** Contains all Bonsai-specific fields including tree shape, pot type, and estimated age.
  **Dáng cây (Thế cây)**                  **Dropdown.** Allows choosing the tree's structural style (e.g., Straight, Cascade, Literati). Used to classify Bonsai aesthetics.
  **Loại chậu đi kèm**                    **Radio group.** Selects the type of pot included with the tree (ceramic, stone, or plastic/soil bag). Important for valuation.
  **Tuổi cây (ước lượng)**                **Text input.** Estimated age of the Bonsai, often used to determine value.
  **Đăng tin cây cảnh (Xem trước)**       **Button (disabled).** Display-only button to mimic the final form layout. Submission is not allowed in preview mode.
  **Preview banner**                      **Container.** Highlights that the user is viewing the Bonsai posting form in preview mode only.
  **Form Preview card**                   **Container holding the entire previewed form**, including category, attributes, and disabled actions.
  **Empty state (optional)**              If no preview data or configuration is loaded, the screen displays only a placeholder layout instead of component previews.

#### 

#### 3.15.21 Admin Analytics 

  --------------------------------------------------------------------
  ![](media/image29.png){width="6.135416666666667in"
  height="2.986111111111111in"}
  --------------------------------------------------------------------

  --------------------------------------------------------------------

*Figure 3.xx: Financial analytics dashboard screen of GreenMarket (Admin
Panel)*

This screen allows the Admin to:

- View key financial metrics such as total revenue, revenue this month,
  and number of packages sold.

- Filter revenue data by predefined time ranges (Tháng này, Tháng trước,
  Năm nay).

- Review a breakdown of sold promotion packages.

- View a table of recent transactions including user, package, date, and
  payment amount.

  **Field name**            **Description**
  ------------------------- ----------------------------------------------------------------------------------------------------------------------------------------------
  **Bộ lọc thời gian**      Dropdown. Allows the Admin to filter analytics data by preset ranges: *Tháng này*, *Tháng trước*, *Năm nay*.
  **Tổng doanh thu**        Number. Total accumulated revenue. Displayed as a large metric card, includes percentage growth compared to previous month.
  **Doanh thu tháng này**   Number. Revenue generated within the currently selected month.
  **Gói dịch vụ đã bán**    Group List. Breakdown of sold promotion packages: • **Trang chủ** -- number sold • **Danh mục** -- number sold • **Tìm kiếm** -- number sold
  **Người dùng**            String. Name or identifier of the user who performed the transaction. Shown in the recent transactions table.
  **Gói dịch vụ**           String. Name of the purchased promotion package.
  **Ngày**                  Date String. The transaction date.
  **Số tiền**               Number. Transaction amount formatted with thousands separators. Displayed right-aligned in the table.

## 4. Non-Functional Requirements

### 4.1 External Interfaces

#### 4.1.1 User Interface (UI)

• **Accessibility:** The system UI must be optimized for non-technical
users, specifically plant hobbyists and small shop owners, ensuring core
tasks such as posting a listing, searching/filtering , and reporting are
accessible within three taps or clicks.

• **Multi-platform Support:**

◦ **Mobile App (React Native):** Must operate stably on both Android and
iOS, providing clear call-to-action buttons like \"Contact,\" \"Post
Listing,\" and \"Report\".

◦ **Web Portal (ReactJS):** Dedicated to Admin functions, requiring a
responsive layout compatible with major browsers such as Chrome,
Firefox, and Edge.

• **Role-Based Display:** The interface must automatically adjust based
on the Actor's role after a successful login, ensuring Managers see
moderation queues and Admins access the system dashboard and account
controls.

#### 4.1.2 Hardware Interfaces

• The system does not require specialized hardware but must be
compatible with standard smartphones and personal computers with an
active internet connection to run the Mobile App and Web Admin portal.

#### **4.1.3 Software Integration** Based on the secondary actors defined in the Use Case specifications, the system must integrate the following software interfaces:

• **OTP/SMS Sandbox:** Integrated to simulate the generation and
verification of OTP codes for registration and login without incurring
real SMS costs.

• **Payment Gateway (MoMo Sandbox):** Integrated to demonstrate the
payment workflow for featured listings or plans .

• **Cloud Storage (Cloudinary/S3):** Provides APIs for uploading,
storing, and distributing images via CDN for listings , report evidence,
and collaborator job deliverables.

• **Database Interface:** Utilizes PostgreSQL to manage structured data,
requiring the implementation of B-tree/GIN indexes to support
multi-criteria searching/filtering and efficient moderation queue
processing.

### 4.2 Quality Attributes

#### 4.2.1 Usability

• The system must provide a seamless experience for all **seven defined
user roles** (Guest, Customer, Manager, Admin, Host, Collaborator, and
Operations Staff).

• The learning curve for new users to complete shop creation or create a
listing should not exceed 10 minutes.

#### 4.2.2 Security

• **Authentication & Authorization:** Implements JSON Web Tokens (JWT)
for session management and enforces Role-Based Access Control (RBAC) on
all APIs to prevent unauthorized access.

• **Account Protection:** Sensitive actions, such as role reassignment
or locking accounts, must be restricted to Admins and recorded in the
audit logs.

#### 4.2.3 Performance

• **Search Speed:** Search and filter queries for listings must return
results in under 2 seconds by leveraging optimized PostgreSQL indexing.

• **Image Processing:** The system must validate file types and sizes
before uploading to ensure that high-resolution images do not degrade
application performance.

#### 4.2.4 Reliability & Availability

• The system must ensure that once a post is approved, it becomes
immediately visible on the public news feed for other users.

• The soft-delete mechanism must guarantee data integrity for posts
moved to the trash, allowing restoration within a 30-day window as per
business rules.5. Requirement Appendix

### 5.1 Business Rules

  --------------------------------------------------------------------
  **ID**   **Rule Definition**
  -------- -----------------------------------------------------------
  BR-01    The phone number must be unique per Account.

  BR-02    First-time users must register their phone number before
           OTP login.

  BR-03    OTP is valid for a limited time in demo (e.g., 60--120
           seconds).

  BR-04    OTP requests must be rate-limited per phone
           number/device/IP (demo).

  BR-05    Users must be authenticated to create shops, posts,
           favorites, block shops, or submit payout requests.

  BR-06    A Customer must have an active Shop before creating posts.

  BR-07    Post status transitions: Draft → Pending →
           Approved/Rejected; Approved can be Hidden by Manager.

  BR-08    Rejected posts must store a rejection reason/template and
           optional note.

  BR-09    Only managers can approve/reject/hide/unhide posts.

  BR-10    Trash retention: posts in Trash can be restored within 30
           days; after that, permanent delete is allowed.

  BR-11    Pending posts are not visible in public feed.

  BR-12    Guests can browse/search/view and submit reports; cannot
           create posts/shops/favorites.

  BR-13    The report must include a reason code; note and evidence
           are optional.

  BR-14    Anti-spam: repeated reports on the same target by the same
           reporter within the window may be blocked.

  BR-15    Resolved reports must store final action and resolution
           notes.

  BR-16    Blocking a shop hides its posts only for that customer.

  BR-17    Category-Attribute config must not contain duplicate
           attribute mapping in the same category.

  BR-18    Required attributes must be provided when submitting a post
           for moderation.

  BR-19    File uploads must validate file type and size limits.

  BR-20    RBAC enforcement: each role can only perform permitted
           actions; unauthorized requests return access denied.

  BR-21    Admin assigns internal roles
           (Manager/Host/Collaborator/Operations Staff) by phone
           number.

  BR-22    Locked accounts cannot login and cannot perform
           authenticated actions.

  BR-23    Exports are Admin-only; each export must be logged.

  BR-24    Earnings and payout are mock only (no real withdrawal) in
           academic scope.

  BR-25    MoMo sandbox payment (optional) is mock/demo only; no real
           money processing.
  --------------------------------------------------------------------

### 

###  

### 5.2 System Messages

  ------------------------------------------------------------------------
  **\#**   **Message   **Message   **Context**        **Content**
           code**      Type**                         
  -------- ----------- ----------- ------------------ --------------------
  1        MSG001      Toast       Unexpected error   Something went
                                                      wrong. Please try
                                                      again.

  2        MSG002      Inline      Phone invalid      Invalid phone number
                                                      format.

  3        MSG003      Toast       OTP sent           OTP has been sent
                                                      (demo).

  4        MSG004      Inline      OTP invalid        OTP is incorrect.
                                                      Please try again.

  5        MSG005      Toast       OTP expired        OTP expired. Please
                                                      request a new OTP.

  6        MSG006      Toast       Rate limit         Too many requests.
                                                      Please wait and try
                                                      again.

  7        MSG007      Toast       Login required     Please login to
                                                      continue.

  8        MSG008      Toast       Access denied      You do not have
                                                      permission to
                                                      perform this action.

  9        MSG009      Toast       Registration       Registration
                                   success            successful. Please
                                                      login with OTP.

  10       MSG010      Toast       Logout success     Logged out
                                                      successfully.

  11       MSG011      Inline      Required field     This field is
                                                      required.

  12       MSG012      Inline      Invalid price      Price must be a
                                                      valid number ≥ 0.

  13       MSG013      Toast       Shop created       Shop created
                                                      successfully.

  14       MSG014      Toast       Shop updated       Shop updated
                                                      successfully.

  15       MSG015      Toast       Post saved         Post saved as draft.

  16       MSG016      Toast       Post submitted     Post submitted for
                                                      moderation.

  17       MSG017      Toast       Post approved      Your post has been
                                                      approved.

  18       MSG018      Toast       Post rejected      Your post was
                                                      rejected. Please
                                                      check the reason.

  19       MSG019      Toast       Moved to trash     Post moved to trash.

  20       MSG020      Toast       Restored           Post restored
                                                      successfully.

  21       MSG021      Dialog      Confirm delete     Are you sure you
                                                      want to delete this
                                                      post?

  22       MSG022      Toast       Favorite added     Added to favorites.

  23       MSG023      Toast       Favorite removed   Removed from
                                                      favorites.

  24       MSG024      Toast       Report submitted   Report submitted.
                                                      Thank you.

  25       MSG025      Toast       Report cancelled   Report cancelled.

  26       MSG026      Toast       Report resolved    Your report has been
                                                      resolved.

  27       MSG027      Toast       Upload failed      Upload failed.
                                                      Please try again.

  28       MSG028      Inline      File too large     File size exceeds
                                                      the limit.

  29       MSG029      Inline      Unsupported file   Unsupported file
                                                      type.

  30       MSG030      Toast       Account locked     Your account is
                                                      locked. Contact
                                                      support.

  31       MSG031      Toast       Export ready       CSV export is ready
                                                      to download.

  32       MSG032      Toast       Payment sandbox    Payment initiated
                                                      (sandbox demo).

  33       MSG033      Toast       Payout requested   Payout request
                                                      submitted (mock).

  34       MSG034      Toast       Job accepted       Job accepted
                                                      successfully.

  35       MSG035      Toast       Job declined       My job declined.

  36       MSG036      Toast       Deliverable        Deliverable
                                   submitted          submitted
                                                      successfully.

  37       MSG037      Toast       Blocked shop       The shop was
                                                      blocked. Its posts
                                                      will be hidden.

  38       MSG038      Toast       Unblocked shop     Shop unblocked.

  39       MSG039      Toast       No results         No results found.
                                                      Try different
                                                      filters.
  ------------------------------------------------------------------------

![](media/image1.png){width="2.960998468941382in"
height="0.90998687664042in"}

**[CAPSTONE PROJECT REPORT]{.smallcaps}**

**Report 1 -- Project Introduction**

> -- Hanoi, January 2026 --

**Table of Contents**

[I. Record of Changes 3](#i.-record-of-changes)

[II. Definition and Acronyms 4](#ii.-definition-and-acronyms)

> [1. Acronym and Definition 4](#_heading=h.n4si7jf8jhaj)
>
> [2. Document Convention 4](#_heading=h.z1b97d6xk8e0)

[III. Project Introduction 5](#iii.-project-introduction)

> [1. Overview 5](#overview)
>
> [1.1 Project Information 5](#project-information)
>
> [1.2 Project Purpose 5](#project-purpose)
>
> [1.3 Project Stakeholders 6](#_heading=)
>
> [2. Product Background 6](#product-background)
>
> [3. Existing Systems 7](#_heading=)
>
> [3.1 bonbanh.com 7](#_heading=)
>
> [3.2 Chợ Tốt (chotot.com) and Facebook Marketplace 8](#_heading=)
>
> [4. Solution & Opportunity 9](#_heading=)
>
> [5. Project Scope & Limitations 10](#_heading=)
>
> [5.1 Major Features 10](#major-features)
>
> [5.2 Limitations & Exclusions 11](#limitations-exclusions)

# I. Record of Changes

  ---------------------------------------------------------------------------
  **Date**     **A\*\   **In       **Change Description**
               M, D**   charge**   
  ------------ -------- ---------- ------------------------------------------
  09/01/2026   A        NamPH      Create Report 1 Document

  10/01/2026   A        NamPH      Add Major Features

  11/01/2026   M        NamPH      Update Product Background and Solution &
                                   Opportunity

  15/01/2026   M        NamPH      Update Report 1 Document

                                   

                                   

                                   

                                   

                                   

                                   

                                   

                                   

                                   
  ---------------------------------------------------------------------------

\*A - Added M - Modified D - Deleted

# II. Definition and Acronyms 

+--------------+--------------------------------------------------+
| **Acronym**  | **Definition**                                   |
+--------------+--------------------------------------------------+
| > GOPM       | > GreenMarket -- Online Plant Market             |
+--------------+--------------------------------------------------+
| > RBAC       | > Role-Based Access Control                      |
+--------------+--------------------------------------------------+
| > OTP        | > One-Time Password                              |
+--------------+--------------------------------------------------+
| > API        | > Application Programming Interface              |
+--------------+--------------------------------------------------+
| > CDN        | > Content Delivery Network                       |
+--------------+--------------------------------------------------+
| > RDBMS      | > Relational Database Management System          |
+--------------+--------------------------------------------------+
| > WBS        | > Work Breakdown Structure                       |
+--------------+--------------------------------------------------+
| > RACI       | > Responsible/Accountable/Consulted/Informed     |
+--------------+--------------------------------------------------+
| > KPI        | > Key Performance Indicator                      |
+--------------+--------------------------------------------------+
| > E2E        | > End-to-End                                     |
+--------------+--------------------------------------------------+
| > UC         | > Use Case                                       |
+--------------+--------------------------------------------------+
| > PoC        | > Proof of Concept                               |
+--------------+--------------------------------------------------+
| > CI/CD      | Continuous Integration/Continuous Deployment     |
+--------------+--------------------------------------------------+
| > ORM        | [Object-Relational Mapping]{.mark}               |
+==============+==================================================+

## 

# III. Document Convention

  **Item**                    **Convention**
  --------------------------- --------------------------------------------------------------------------------------------------------------------------------------
  Document Title              **Report 1 -- Project Introduction**
  Project Name                **GreenMarket -- Digital Ornamental Plant Marketplace**
  Document ID                 **GM-R1**
  Versioning                  Format: **vMajor.Minor** (e.g., v1.0, v1.1). Major = big scope change, Minor = small updates/typos
  Date Format                 **YYYY-MM-DD** (e.g., 2026-01-22)
  Language                    **English**
  Terminology                 Use **Post** (not Listing) consistently; use **Shop**, **Guest/Customer/Admin/Manager/Host/Collaborator/Operations Staff**
  Acronyms                    First time mention: **OTP (One-Time Password)**, **RBAC (Role-Based Access Control)**, **SRS (Software Requirements Specification)**
  Figures & Tables            Numbering: **Figure 1.1**,... with captions below (Figure) / above (Table)
  References                  Use numbered citations: **\[1\], \[2\], \[3\],** and provide full links in References section
  Assumptions / Scope Notes   Clearly label as **In scope / Out of scope / Optional**
  Change Log                  Track changes in the "Record of Changes" table (if template has it)

# III. Project Introduction

## 1. Overview

### 1.1 Project Information

English name: GreenMarket -- Online Plant Market

Vietnamese name: GreenMarket -- Hệ thống chợ cây cảnh số

Project code: GOPM (GreenMarket -- Online Plant Market)

Group name: Group 96

Software type: Mobile Application (User-side) + Web Portal (Admin-side)

Technology stack: NodeJS + Express + Prisma ORM(Back-end), PostgreSQL,
ReactJS (Admin Web), React Native (Mobile App)

### 1.2 Project Purpose

The purpose of this project is to build GreenMarket -- a digital listing
marketplace platform for the ornamental plant community in Vietnam,
designed for individual hobbyists and small to medium-sized plant
businesses. GreenMarket aims to streamline the process of creating
storefronts and publishing plant listings, including structured plant
information (taxonomy and attributes), photo uploads, search and
multi-criteria filtering, and listing performance tracking, all within a
centralized and synchronized online platform. The system enables users
to discover suitable plants efficiently and contact sellers directly via
phone information shown on listings, while supporting a moderation and
reporting workflow (managed by operational roles) to maintain content
quality and reduce spam/duplicate posts. In addition, the platform
demonstrates a future-ready service model, such as featured listings or
paid plans through sandbox integrations (e.g., MoMo sandbox and OTP
sandbox for demo), thereby reducing manual posting effort, improving
listing transparency, and enhancing the overall trust and usability of
plant trading activities.

### 1.3 Project Stakeholders

  ---------------------------------------------------------------------
  **Full Name**    **Role**   **Email**                    **  Mobile**
  ---------------- ---------- ---------------------------- ------------
  Nguyễn Thành Ý   Lecturer   ynt4@fe.edu.vn               0934290389

  Nguyễn Thành Nam Leader     namnthe161123@fpt.edu.vn     0978195419

  Phạm Hoài Nam    Member     namphhe171360@fpt.edu.vn     0962684972

  Bùi Đức Dũng     Member     dungbdhe171539@gmail.com     0375667822

  Tô Trọng Nghĩa   Member     nghiatthe173582@fpt.edu.vn   0985783409

  Dương Hải Phong  Member     phongdhhe176650@fpt.edu.vn   0833080988
  ---------------------------------------------------------------------

## 2. Product Background

In Vietnam, online buying and selling have grown rapidly in recent
years, including for niche hobby products such as ornamental plants.
Buyers increasingly expect to find suitable items quickly, filter by key
attributes, and contact sellers conveniently---without spending
excessive time scrolling through unstructured social feeds. Meanwhile,
many small plant shops and individual hobbyists struggle with organizing
storefront content, standardizing product information, and maintaining
trust when trading through informal channels.

The strong growth of both the ornamental plant industry and the online
marketplace environment reinforces this demand. Vietnam's flower and
ornamental plant cultivation area reached nearly **45,000 hectares in
2024**, with industry production value exceeding **VND 45,000 billion
per year** and flower export value over **US\$100 million**
[[\[1\]]{.underline}](https://vnua.edu.vn/tin-tuc-su-kien/dao-tao/tuong-lai-nganh-ve-hoa-cay-canh-viet-nam-se-ra-sao-56855).
At the same time, Vietnam's e-commerce ecosystem is expanding strongly:
total e-commerce revenue in the first nine months of 2024 exceeded **VND
227 trillion** (nearly **+38% year-on-year**)
[[\[2\]]{.underline}](https://moit.gov.vn/khoa-hoc-va-cong-nghe/thuong-mai-dien-tu-viet-nam-nam-2024-nhung-buoc-tien-va-thach-thuc.html?utm_source=chatgpt.com),
while the online retail market reached **US\$32 billion in 2024** with
around **27% growth**
[[\[3\]]{.underline}](https://vecom.vn/bao-cao-chi-so-thuong-mai-dien-tu-viet-nam-2025?utm_source=chatgpt.com).
In practice, marketplace channels have also proven effective for
plant-related products, such as large-volume sales through platforms
like TikTok Shop during peak seasons
[[\[4\]]{.underline}](https://congthuong.vn/20-000-chau-cuc-mam-xoi-chay-hang-qua-nen-tang-tiktok-shop-438662.html?utm_source=chatgpt.com).

Beyond macro statistics, the GreenMarket idea originates from real user
needs. A parent of one group member is an active ornamental-plant
hobbyist who frequently participates in trading communities. Through
direct observation and discussions, the team identified recurring pain
points: (1) post information is often inconsistent and unstructured
(species/taxonomy, size/age, pot type, condition, shipping notes), (2)
"scroll-away" behavior makes it difficult to find posts again, (3)
limited plant-specific filtering causes inefficient searching, and (4)
trust risks can occur when trading through informal channels, including
concerns about mixed-quality or misleading listings
[[\[5\]]{.underline}](https://thoibaotaichinhvietnam.vn/thi-truong-giong-cay-canh-tren-mang-internet-that-gia-lan-lon-149786.html?utm_source=chatgpt.com).

In informal trading channels (social groups/feeds), posts quickly get
pushed down by new content, making it hard for sellers to reach buyers
and for buyers to revisit high-quality listings. This creates demand for
structured discovery and controlled visibility, where sellers can
optionally pay for better placements while non-paying posts remain
discoverable but appear in lower positions/pages.

Recognizing these challenges, **GreenMarket** was initiated as a listing
marketplace platform tailored for ornamental plants. The system focuses
on structured storefront creation, standardized taxonomy/attributes,
photo-based posts, search and multi-criteria filtering, and
moderation/reporting workflows to improve content quality and
trust---while remaining feasible within a **4-month capstone scope**.

## 3. Existing Systems

### 3.1 bonbanh.com

  --------------------------------------------------------------------
  ![A screenshot of a web page Description automatically
  generated](media/image4.png){width="6.135416666666667in"
  height="3.625in"}
  --------------------------------------------------------------------

  --------------------------------------------------------------------

Figure 3.1.1: *Bon banh interface*

**Description:** bonbanh.com is a well-known classified listing website
in Vietnam (automotive domain). It provides a listing-based marketplace
model where sellers post advertisements and buyers search/filter by
structured attributes, then contact sellers directly for transactions.

**Link:**

- https://bonbanh.com

**Features:**

- Structured listing posting: Sellers can create listings with key
  fields (brand/model/year/price/location, images).

- Attribute-based search & filtering: Buyers can filter listings using
  multiple structured attributes.

- Featured/VIP advertisements: Support priority/featured listings to
  increase exposure.

- Content moderation workflow: Listings can be reviewed/controlled to
  reduce spam and duplicate posts.

- Contact-driven transaction model: Buyers contact sellers directly
  (outside-system transaction).

### 3.2 Chợ Tốt (chotot.com) and Facebook Marketplace

  --------------------------------------------------------------------
  ![A collage of images of a person working on a computer Description
  automatically
  generated](media/image5.png){width="6.135416666666667in"
  height="3.111111111111111in"}
  --------------------------------------------------------------------

  --------------------------------------------------------------------

Figure 3.2.1: *Facebook Marketplace interface*

  --------------------------------------------------------------------
  ![A screenshot of a computer Description automatically
  generated](media/image3.png){width="6.135416666666667in"
  height="3.3472222222222223in"}
  --------------------------------------------------------------------

  --------------------------------------------------------------------

Figure 3.2.2: *Cho tot interface*

**Description:** Chợ Tốt and Facebook Marketplace are popular
general-purpose marketplaces/classified channels in Vietnam. They allow
users to post items quickly, browse categories, and contact sellers,
supporting large-scale community trading.

**Link:**

- https://www.chotot.com

- https://www.facebook.com/marketplace

**Features:**

- Category-based browsing: Users browse postings by categories and
  locations.

- Fast posting workflow: Users can create postings quickly with basic
  information and images.

- Search support: Keyword search to find relevant listings.

- Contact tools: Buyers contact sellers through direct contact methods
  (depending on the platform).

- Reporting mechanisms: Users can report suspicious or inappropriate
  content for platform review.

## 4. Solution & Opportunity

Vietnam's ornamental plant industry is expanding rapidly, creating a
strong foundation for a specialized digital marketplace. Industry
sources report that Vietnam currently has around 45,000 hectares of
flower and ornamental plant cultivation, with an annual production value
of over VND 45,000 billion and flower export value exceeding US\$100
million
[[\[6\]]{.underline}](https://vnua.edu.vn/tin-tuc-su-kien/tin-hoat-dong-khac/kim-ngach-xuat-khau-hoa-vuot-moc-100-trieu-usd-57318).
At the same time, Vietnam's online commerce ecosystem continues to grow:
the Ministry of Industry and Trade reported that in the first nine
months of 2024, e-commerce revenue exceeded VND 227 trillion (nearly 38%
YoY growth), and VECOM estimated the online retail market size in 2024
at US\$32 billion with 27% growth
[[\[7\]]{.underline}](https://moit.gov.vn/khoa-hoc-va-cong-nghe/thuong-mai-dien-tu-viet-nam-nam-2024-nhung-buoc-tien-va-thach-thuc.html?utm_source=chatgpt.com).
These signals show that both the plant sector and online marketplaces
are large enough to support a domain-focused platform.

However, there is a practical gap between general-purpose selling
channels and the domain-specific needs of ornamental plant trading. In
informal/community-feed channels, listings are often inconsistent
(missing plant taxonomy/attributes, size/age, pot type, condition,
shipping notes), posts "scroll away" quickly, and spam/duplicates reduce
trust. As a result, buyers spend significant time verifying information,
and sellers struggle to present products professionally and
consistently. In addition, visibility is a key pain point for sellers:
posts in community feeds quickly get pushed down by newer content,
reducing reach and making it hard to recover interested buyers. This
creates a practical willingness to pay for better placement positions
(e.g., Home top slots, Category top slots) so that high-quality posts
can be exposed to more users during critical selling periods.

GreenMarket is designed to solve these problems within a feasible
capstone scope by focusing on a listing marketplace model (not full
e-commerce checkout). The platform standardizes plant listings through
taxonomy and structured attributes, enables multi-criteria
search/filtering, and organizes sellers through storefronts. It also
introduces a moderation and reporting workflow (operated by the Manager)
to maintain content quality, while transactions remain contact-driven
via the phone number displayed on listings. To support sustainable
operation, GreenMarket introduces placement-based service packages:
customers can purchase promotion packages tied to specific
high-visibility slots (Home/Category/Search top) for a limited duration.
Non-paying posts remain available but appear in lower-priority
positions/pages, while promoted posts are displayed in reserved
sponsored sections according to configured rules. To keep the project
realistic but deliverable, payments and OTP login are demonstrated using
MoMo sandbox and OTP/SMS sandbox (mock) integrations.

GreenMarket also records user interactions by placement (impressions,
clicks, post-detail views, and contact actions) to measure which slots
and categories generate higher engagement. Based on these analytics, the
system provides trend summaries and simple recommendations for Admin and
Customers (e.g., which placement package is more effective for a given
category/time). The "AI" component is implemented in a lightweight
manner (rule-based scoring and optional AI-assisted insight generation
via an external API), avoiding the need to train a custom model within
the capstone timeline.

By addressing a clear niche segment with structured data, content
governance, and placement-based monetization, GreenMarket is both a
practical solution for users and a realistic business opportunity in
Vietnam's growing marketplace ecosystem---especially when online
channels have already shown strong outcomes even for plant products
(e.g., a reported case of selling 20,000+ ornamental chrysanthemum pots
via TikTok Shop)
[[\[8\]]{.underline}](https://congthuong.vn/20-000-chau-cuc-mam-xoi-chay-hang-qua-nen-tang-tiktok-shop-438662.html?utm_source=chatgpt.com).

## 5. Project Scope & Limitations

  -----------------------------------------------------------------------
  ![](media/image2.png){width="6.8125in" height="3.9843755468066493in"}
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

Figure 5.1: *Major feature tree for GOPM*

*Link diagram: [[Link
diagram]{.underline}](https://drive.google.com/file/d/1Veg9kz6LMeziXXZuZdBUqW7bcTXS07cG/view?usp=sharing)*

### 5.1 Major Features

FE-01: OTP-based authentication via phone number (register phone / login
with OTP / logout) and role-based access control (RBAC).

FE-02: Browse posts by categories and view post feed (home).

FE-03: Search, filter, and sort posts by structured plant attributes
(taxonomy, size, price, location, etc.).

FE-04: View post details (images, attributes, shop info) and contact
seller via phone number (outside-system).

FE-05: Shop management for Customer (create/update shop profile, contact
info).

FE-06: Post management for Customer (create/edit/move-to-trash/restore;
manage post images; submit for moderation).

FE-07: Favorites management (bookmark post, view/remove/clear
favorites).

FE-08: Reporting mechanism (Guest/Customer can submit a report for
post/shop with reason codes and evidence).

FE-09: Moderation workflow for Manager (moderation queue,
approve/reject/hide, resolve reports, action logs).

FE-10: Taxonomy & attribute management for Admin (categories, attribute
schema configuration).

FE-11: Template/Reason configuration for Admin (report reasons &
rejection reasons/messages).

FE-12: Analytics & export for Admin (dashboard KPIs including placement
performance/CTR; export CSV reports/analytics).

FE-13: Placement-based promotion packages (position-based): purchase
package for specific slots (Home/Category/Search) and assign to a post
for a limited duration.

FE-14: Engagement analytics by placement and insight recommendations
(trend summary + promotion suggestions) using lightweight scoring and
optional AI-assisted text insights.

FE-15 (Optional): Payment demonstration for packages via MoMo Sandbox
(initiate payment, callback status).

FE-16 (Optional): Host module for content/webinar publishing and
earnings statement (mock).

FE-17 (Optional): Collaborator service module (profile/availability,
customer request service, accept job & delivery update).

FE-18 (Optional): Operations Staff internal support module (assigned
tasks/tickets and operational updates).

### 5.2 Limitations & Exclusions

LI-1: No real-money payment processing in Phase 1: MoMo sandbox is used
for demonstration only.

LI-2: No real SMS sending in Phase 1: OTP is implemented via OTP/SMS
sandbox (mock) for demo mode.

LI-3: No built-in real-time chat between users: transactions are
contact-driven via phone number shown in listings.

LI-4: No live webinar streaming: Host module (if implemented) is limited
to publishing webinar information/content posts.

LI-5: No payout settlement: earnings/commission (if implemented) are
displayed as a statement (mock), without a real withdrawal.

LI-6: Advanced AI moderation is not included; moderation is rule-based +
manual review by Manager.

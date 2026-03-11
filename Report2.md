![](media/image2.png){width="2.960998468941382in"
height="0.90998687664042in"}

**[CAPSTONE PROJECT REPORT]{.smallcaps}**

**Report 2 -- Project Management Plan**

> -- Hanoi, January 2026 --

**Table of Contents**

[I. Record of Changes 3](#i.-record-of-changes)

[II. Project Management Plan 4](#ii.-project-management-plan)

> [1. Overview 4](#overview)
>
> [1.1 Cost & Time Estimations 4](#cost-time-estimations)
>
> [1.2 Project Objectives 5](#project-objectives)
>
> [1.3 Project Risks 6](#project-risks)
>
> [2. Management Approach 7](#management-approach)
>
> [2.1 Project Processes 7](#project-processes)
>
> [2.2 Quality Management 8](#section-1)
>
> [2.3 Project Training Plan 9](#section-2)
>
> [3. Responsibility Assignments 10](#responsibility-assignments)
>
> [4. Project Communications 11](#project-communications)
>
> [5. Configuration Management 12](#configuration-management)
>
> [5.1 Document Management 12](#document-management)
>
> [5.2 Source Code Management 12](#source-code-management)
>
> [5.3 Tools & Infrastructures 12](#tools-infrastructures)

# I. Record of Changes

  --------------------------------------------------------------------------
  **Date**     **A\*\   **In        **Change Description**
               M, D**   charge**    
  ------------ -------- ----------- ----------------------------------------
  10/01/2026   A        NamPH       Create Report 2 Document

  15/01/2026   M        Team        Update Report 2 for GreenMarket (4-month
                                    iterative plan, WBS, RACI,
                                    communications, configuration).

  18/01/2026   A        NamPH       Add Management Approach

  20/01/2026   M        NamPH       Update Configuration Management

                                    

                                    

                                    

                                    

                                    

                                    

                                    

                                    

                                    

                                    
  --------------------------------------------------------------------------

\*A - Added M - Modified D - Deleted

# II. Project Management Plan

## 1. Overview

### 1.1 Cost & Time Estimations

### 

  ----------------------------------------------------------------------------------------------
  **No.**             **Work items / Deliverables**            **Effort           **Timeline**
                                                               (person-days)**    
  ------------------- ---------------------------------------- ------------------ --------------
  ***1***             ***Stage 1: Initiation & Planning (weeks ***30***           
                      1--2)***                                                    

  1.1                 Project kickoff, roles, communication    5                  Week1
                      plan                                                        

  1.2                 Requirements elicitation (actors, scope, 10                 Week1
                      MVP vs optional)                                            

  1.3                 Jira/Git setup, conventions, Definition  10                 Week1
                      of Done                                                     

  1.4                 Report 1: Project Introduction (final)   5                  Week2

  ***2***             ***Stage 2: Analysis & Requirement       ***25***           
                      Baseline (weeks 1--2)***                                    

  2.1                 Define actors, high-level use cases, and 10                 Week2
                      scope baseline                                              

  2.2                 Screen flows & authorization matrix;     10                 Week2
                      baseline main flows                                         

  2.3                 Report 3: SRS v1.0 (baseline             5                  Week2
                      UC/actors/diagrams)                                         

  ***3***             ***Stage 3: Architecture & Design        ***25***           
                      Baseline (weeks 1--2)***                                    

  3.1                 System architecture & technology stack   10                 Week2
                      definition                                                  

  3.2                 Database design (PostgreSQL), ERD +      10                 Week2
                      entities                                                    

  3.3                 Report 4: SDS v1.0 (baseline)            5                  Week2

  ***4***             ***Stage 4: Implementation (Iterative &  ***240***          
                      Incremental) (weeks 3--14)***                               

  [4.1]{.underline}   [Implementation Iteration 1 (weeks       [60]{.underline}   
                      3--5)]{.underline}                                          

  4.1.1               Implement Auth: phone registration + OTP 15                 Week3
                      sandbox login/logout + RBAC base                            

  4.1.2               Implement News:                          15                 Week3
                      browse/search/filter/sort posts + post                      
                      detail                                                      

  4.1.3               Implement Shop: create/edit shop, view   10                 Week4
                      shop detail                                                 

  4.1.4               Implement Post MVP: create/edit draft    15                 Week5
                      post + image upload + my posts list                         

  4.1.5               Code Package & Unit Testing Report       5                  Week5
                      (Iteration 1)                                               

  4.1.6               Software Package Version 1               0                  Week5

  [4.2]{.underline}   [Implementation Iteration 2 (weeks       [60]{.underline}   
                      6--8)]{.underline}                                          

  4.2.1               Implement Moderation (Manager): queue +  15                 Week6
                      review + approve/reject/hide + logs                         

  4.2.2               Implement Reports: report post/shop +    15                 Week6
                      evidence upload + view resolution                           

  4.2.3               Implement Favorites & Block/Unblock shop 10                 Week7

  4.2.4               Implement Trash/Restore post (restore    10                 Week7
                      within 30 days rule)                                        

  4.2.5               Update Report 3: SRS v1.1 (sync UC/flows 5                  Week8
                      after Iteration 2)                                          

  4.2.6               Integration Test Cases (v1)              5                  Week8

  4.2.7               Software Package Version 2               0                  Week8

  [4.3]{.underline}   [Implementation Iteration 3 (weeks       [60]{.underline}   
                      9--11)]{.underline}                                         

  4.3.1               Admin Web: Account management (roles,    15                 Week9
                      lock/unlock, audit logs)                                    

  4.3.2               Admin Web: Category & Attribute +        15                 Week9
                      category-attribute config + preview                         

  4.3.3               Template management (report reasons &    10                 Week10
                      reject templates) + basic moderation                        
                      config                                                      

  4.3.4               Export CSV + basic analytics aggregation 10                 Week10
                      (dashboard KPIs)                                            

  4.3.5               Update Report 4: SDS v1.2 (refine design 5                  Week11
                      after Iteration 3)                                          

  4.3.6               Report 5: Integration Test Report        5                  Week11

  4.3.7               Software Package Version 3               0                  Week11

  [4.4]{.underline}   [Implementation Iteration 4 (weeks       [60]{.underline}   
                      12--14)]{.underline}                                        

  4.4.1               UX/UI refinement + bug fixing            15                 Week12

  4.4.2               Security hardening (RBAC checks, rate    15                 Week12
                      limiting) + performance tuning                              

  4.4.3               System integration + regression testing  15                 Week13

  4.4.4               Update Report 3: SRS v1.2 & Report 4:    10                 Week13
                      SDS v1.3 (final sync)                                       

  4.4.5               Final demo rehearsal + Software Package  5                  Week14
                      Version 4                                                   

  ***5***             ***Stage 5: Verification & Validation    ***40***           
                      (weeks 15--16)***                                           

  5.1                 Report 5: System Test Cases + System     15                 Week15
                      Test Report                                                 

  5.2                 Report 6: User Guides (Installation      15                 Week15
                      Guide, User Manual)                                         

  5.3                 Acceptance Test and Support (bug fixing, 10                 Week16
                      stabilization)                                              

  ***6***             ***Stage 6: Closing (week 16)***         ***20***           

  6.1                 Report 7: Final Project Report           10                 Week16

  6.2                 Presentation File (slides + demo script) 10                 Week16
  ----------------------------------------------------------------------------------------------

**Total estimated time: 380 person-days (with 5h/day)**

### 1.2 Project Objectives

+--------+--------------+------------+---------------+--------------+------------------------------------------------------+
| **\#** | **Metric**   | **Unit**   | > **Planned** | > **Actual** | **Notes / References**                               |
+--------+--------------+------------+---------------+--------------+------------------------------------------------------+
| 1      | Effort Usage | Person-day | 380 pds       | ---          | Tracked via Project Tracking / weekly timesheet      |
+--------+--------------+------------+---------------+--------------+------------------------------------------------------+
| 2      | Review       | No. of     | ≤ 10 major    | ---          | Design + code reviews checklist                      |
|        | Defects      | defects    |               |              |                                                      |
+--------+--------------+------------+---------------+--------------+------------------------------------------------------+
| 3      | Unit Test    | No. of     | ≤ 25          | ---          | Jest (backend) + basic component tests               |
|        | Defects      | defects    |               |              |                                                      |
+--------+--------------+------------+---------------+--------------+------------------------------------------------------+
| 4      | Integration  | No. of     | ≤ 20          | ---          | API contract tests via Postman/Newman                |
|        | Test Defects | defects    |               |              |                                                      |
+--------+--------------+------------+---------------+--------------+------------------------------------------------------+
| 5      | System Test  | No. of     | ≤ 25          | ---          | E2E flows:                                           |
|        | Defects      | defects    |               |              | Guest/Customer/Manager/Admin/Host/Collaborator/Staff |
+--------+--------------+------------+---------------+--------------+------------------------------------------------------+
| 6      | Timeliness   | \%         | ≥ 90%         | ---          | On-time deliverables / total deliverables            |
+--------+--------------+------------+---------------+--------------+------------------------------------------------------+
| 7      | Requirement  | \%         | ≥ 90%         | ---          | Must-have requirements delivered; fail if ≤ 75%      |
|        | Completeness |            |               |              |                                                      |
+--------+--------------+------------+---------------+--------------+------------------------------------------------------+
| 8      | Demo         | \%         | ≥ 95%         | ---          | All demo scripts pass without critical bugs          |
|        | Readiness    |            |               |              |                                                      |
+========+==============+============+===============+==============+======================================================+

### 1.3 Project Risks

  --------------------------------------------------------------------------------------------------------
  **\#**   **Risk Description**                **Impact**   **Possibility**   **Response Plans**
  -------- ----------------------------------- ------------ ----------------- ----------------------------
  1        Scope creep due to many roles       High         Medium            Mitigation: Freeze MVP at
           (Manager/Host/Staff/Collaborator)                                  Week 7; mark
           and optional features                                              Host/Staff/Collaborator as
                                                                              optional.\
                                                                              Contingency: Drop optional
                                                                              modules; focus on
                                                                              moderation + search/filter.

  2        Integration risk between Mobile     High         Medium            Mitigation: Swagger
           App, Admin Web, and Backend APIs                                   contract + weekly
                                                                              integration checkpoint.\
                                                                              Contingency: Use feature
                                                                              flags and mock data to keep
                                                                              UI progressing.

  3        Performance issues for              High         Medium            Mitigation: Design indexes
           multi-criteria search/filter                                       early and benchmark with
           (PostgreSQL indexes)                                               seed data.\
                                                                              Contingency: Limit filter
                                                                              combinations in MVP;
                                                                              optimize queries.

  4        Content abuse (spam posts/ report   Medium       High              Mitigation: Rule-based
           spam from Guest)                                                   pre-check + rate limiting on
                                                                              posting/reporting.\
                                                                              Contingency: Tighten limits
                                                                              and prioritize manager
                                                                              moderation queue.

  5        Mobile instability (React Native    Medium       Medium            Mitigation: Use stable
           build issues, device-specific bugs)                                RN/Expo versions; test on
                                                                              2--3 devices weekly.\
                                                                              Contingency: Reduce
                                                                              device-specific features;
                                                                              prioritize core flows.

  6        OTP/SMS and Payment integration     Medium       Low               Mitigation: Use OTP sandbox
           complexity                                                         (mock) and MoMo sandbox
                                                                              only.\
                                                                              Contingency: Switch to fully
                                                                              mocked flows while
                                                                              preserving interfaces.

  7        Team coordination and overlapping   Medium       Medium            Mitigation: Clear ownership
           modules                                                            per module + RACI + weekly
                                                                              review.\
                                                                              Contingency: Rebalance
                                                                              tasks; pair-programming for
                                                                              blockers.
  --------------------------------------------------------------------------------------------------------

## 2. Management Approach

### 2.1 Project Processes

  --------------------------------------------------------------------
  ![](media/image1.png){width="6.135416666666667in"
  height="3.4305555555555554in"}
  --------------------------------------------------------------------

  --------------------------------------------------------------------

*Figure 2.1 : Iterative & Incremental Software Development Process
Model*

The project follows an Iterative & Incremental development process
across 4 months (16 weeks). Each iteration delivers a working increment
of GreenMarket (Mobile App + Admin Web + Backend), including planning,
implementation, integration, testing, and stakeholder review. This
approach reduces integration risk and keeps the MVP demo-ready early.

Iteration 1 (Weeks 1--4): OTP sandbox login, storefront, posting
listings, basic browse/search.

Iteration 2 (Weeks 5--8): Moderation (Manager), reporting
(Guest/Customer), categories/attributes, templates.

Iteration 3 (Weeks 9--12): Favorites, analytics dashboard, export CSV,
performance tuning.

Iteration 4 (Weeks 13--16): Stabilization, system testing, demo
rehearsal, final packaging.

### 

### 2.2 Quality Management

- Defect Prevention

<!-- -->

- Establish Coding Standards: Implement coding standards and best
  practices to promote consistent and high-quality code.

- Utilise Static Code Analysis: Employ static code analysis tools to
  detect potential defects early in the development process.

- Conduct Code Reviews: Facilitate regular code reviews to identify and
  address defects before they can propagate through the codebase.

<!-- -->

- Reviewing

<!-- -->

- Regular Reviews: Perform ongoing code, design, and documentation
  reviews to maintain high standards.

- Involve Diverse Perspectives: Engage multiple team members in the
  review process to gain fresh insights and perspectives.

- Provide Constructive Feedback: Offer actionable feedback and ensure
  issues are tracked until resolved.

<!-- -->

- Unit Testing

<!-- -->

- Thorough Situational Analysis: Analyze all possible scenarios,
  including the worst-case situations, to ensure comprehensive testing.

- Alignment with Design: Ensure test cases are well-aligned with the
  system and architectural design.

- Immediate Error Notification: Promptly notify the responsible party of
  any defects, documenting them in the Bug Tracking software with
  appropriate priority levels.

- Timely Resolutions: Ensure that individuals accountable for defects
  have solutions to address issues as quickly as possible.

- State Transition for Test Cases: All test cases should initially
  reflect a \"failure\" state, transitioning to \"pass\" after necessary
  modifications or no significant changes to the primary code.

<!-- -->

- Integration Testing

<!-- -->

- Design Test Scripts and Cases: Create comprehensive test scripts and
  cases that align with system and architectural design.

- Error Notification and Documentation: Similar to unit testing,
  promptly inform the responsible individual of any defects and record
  them in the Bug Tracking software.

- Timely Defect Resolution: Ensure that accountable team members are
  equipped to resolve defects swiftly.

- Initial Failure State: Start all test cases in a \"failure\" state,
  transitioning to \"pass\" after suitable adjustments.

- Smooth Internal Module Functionality: Verify that internal modules
  within the system operate seamlessly together.

<!-- -->

- System Testing

<!-- -->

- Alignment with Design Specifications: Ensure that test cases align
  closely with the system and architectural design.

- Prompt Defect Reporting: Similar procedures for defect reporting and
  prioritization as in previous testing stages.

- Effective Defect Management: Ensure responsible parties can quickly
  address and resolve defects.

- State Transition for Test Cases: Maintain the \"failure\" to \"pass\"
  state transition protocol for all test cases.

- User-Centric Evaluation: Clearly differentiate the user's perspective
  from that of the developer, ensuring an objective evaluation process.

### 

### 2.3 Project Training Plan

  --------------------------------------------------------------------
  **Training Area**             **Participants**    **When, Duration**
  ----------------------------- ------------------- ------------------
  GreenMarket domain &          All members         Week 1 (2
  requirements (marketplace +                       sessions)
  moderation)                                       

  NodeJS/Express API +          BE Core, BE Support Week 1--2 (3
  JWT/RBAC + OTP sandbox                            sessions)

  PostgreSQL schema & indexing  BE Core, BE Support Week 2 (2
  for search/filter                                 sessions)
  (B-tree/GIN, query plan                           
  basics)                                           

  ReactJS Admin (tables, forms, Web FE              Week 2--3 (3
  role guards)                                      sessions)

  React Native/Expo             App Dev A, App Dev  Week 2--3 (3
  (navigation, networking,      B                   sessions)
  image upload)                                     

  Testing                       All members         Week 3 (2
  (unit/integration/system) +                       sessions)
  Postman/Newman                                    

  Git/GitHub flow (branching,   All members         Week 1 (1 session)
  PR review)                                        

  Project management tools      All members         Week 1 (1 session)
  (Trello/Jira, GitHub Issues)                      

  MoMo sandbox payment flow     BE Support, App Dev Week 8 (1 session)
  (demo)                        B                   
  --------------------------------------------------------------------

##  

## 3. Responsibility Assignments

> **RACI Chart**: R\~Responsible, A\~Accountable, C\~Consulted,
> I\~Informed

  -----------------------------------------------------------------------------------------
  **Work Package**     **NamNT      **DungBD (BE **NamPH    **NghiaTT(App   **PhongDH(App
                       (Leader/BE   Support)**   (Web Admin Dev A)**        Dev B)**
                       Core)**                   FE)**                      
  -------------------- ------------ ------------ ---------- --------------- ---------------
  Requirements         A            R            C          C               C
  Analysis                                                                  

  Architecture & DB    A            R            C          I               I
  Design                                                                    

  API Development      A            R            I          C               C
  (Backend)                                                                 

  Search/Filter &      C            A            R          C               C
  Indexing                                                                  

  Mobile App           I            C            I          R               R
  Development                                                               

  Web Admin            I            C            R          I               I
  Development                                                               

  Testing & Quality    A            R            C          C               C
  Control                                                                   

  Documentation        A            C            R          C               C
  (Reports/Guides)                                                          

  Deployment/DevOps    A            R            C          I               I

  Demo & Presentation  A            R            R          R               R
  -----------------------------------------------------------------------------------------

##  

## 4. Project Communications

+-----------------+----------+----------------+--------------+-------------+
| **Communication | **Who/   | **Purpose**    | **When,      | **Type,     |
| Item**          | Target** |                | Frequency**  | Tool,       |
|                 |          |                |              | Method(s)** |
+-----------------+----------+----------------+--------------+-------------+
| Weekly meeting  | All team | Report         | 3:00 pm      | Offline     |
| with mentor     | members  | progress.      | every        | meeting     |
|                 | & mentor | Discuss and    | Wednesday    |             |
|                 |          | solve problems |              |             |
+-----------------+----------+----------------+--------------+-------------+
| Weekly Team     | All team | Report tasks.  | 9:00 pm      | Online      |
| Meeting         | members  |                | every Sunday | meeting     |
|                 |          | Discuss        |              | through     |
|                 |          | issues,        |              | Google Meet |
|                 |          | resolve        |              |             |
|                 |          | problems.      |              |             |
|                 |          | Define the     |              |             |
|                 |          | next task      |              |             |
+-----------------+----------+----------------+--------------+-------------+
| Unscheduled     | All team | Discuss and    | When there   | Online      |
| meeting         | members  | solve          | are          | meeting     |
|                 |          | important      | significant  | through     |
|                 |          | issues         | problems     | Google Meet |
|                 |          |                | that need to |             |
|                 |          |                | be solved    |             |
|                 |          |                | quickly      |             |
+-----------------+----------+----------------+--------------+-------------+
| Daily update    | All team | Share daily    | 9:00 am,     | Chat group  |
|                 | members  | progress and   | Mon--Fri     |             |
|                 |          | blockers       |              |             |
+=================+==========+================+==============+=============+

##  

## 5. Configuration Management

### 5.1 Document Management

The development team uses Google Docs, Google Sheets, and Google Drive
for project documentation.

These platforms allow multiple people to view, edit, comment, and share
at the same time, and can customize permissions for each member to
ensure proper roles. The platforms also support tracing changes made,
who is responsible, and comparing different versions at the same time,
which increases the efficiency of using and managing project documents.

### 5.2 Source Code Management

The development team uses GitHub for version control of our source code,
which simplifies the processes of storing, uploading, and downloading
code. GitHub allows us to manage changes quickly and accurately,
facilitating efficient task distribution and collaboration. This
streamlined approach enhances our ability to produce high-quality
programming projects.

### 5.3 Tools & Infrastructures

  --------------------------------------------------------------------
  **Category**         **Tools / Infrastructure**
  -------------------- -----------------------------------------------
  Technology           NodeJS + Express (Back-end), ReactJS (Admin
                       Web), React Native/Expo (Mobile App)

  Database             PostgreSQL

  ORM                  Prisma

  OTP/SMS              OTP/SMS Sandbox (Mock)

  Payment              MoMo Sandbox (Mock)

  IDEs/Editors         Visual Studio Code, Android Studio (optional)

  Diagramming          draw.io (diagrams.net), Figma (UI wireframe)

  Documentation        Google Docs/Sheets/Drive

  Version Control      GitHub (source code), GitHub Projects/Issues

  Testing              Jest (backend), Postman/Newman (API), Manual
                       E2E checklist

  Deployment/Hosting   VPS/Render/Fly.io (demo), Cloudinary/S3 for
                       images

  Project Management   Trello/Jira, Google Meet, Zalo/Discord group
  --------------------------------------------------------------------

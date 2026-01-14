# Organization Admin Guide

This guide is designed for **Organization Administrators**. It covers how to manage your organization's settings, users, and courses within codePost.

## Overview

The Organization Dashboard provides a high-level view of your organization's activity.

- **Organization Details:** View your organization's name, short name, and SSO status.
- **Analytics:** Monitor key metrics such as Total Users, Active Users (30d), Total Courses, Active Courses, and Submission counts.

## Managing Users

Navigate to the **Users** tab to manage the members of your organization.

### User Actions

You can perform the following actions on users:

- **Approve/Decline:** For users in "Pending" status who have requested to join.
- **Promote to Org Staff:** Grant a user administrative privileges within the organization.
- **Demote:** Remove administrative privileges from a staff member.
- **Reset Password:** Send a password reset email to a user (only for non-SSO users).
- **Remove:** Permanently remove a user from the organization.

You can also search for specific users by email using the search bar.

#### Users

Users are the backbone of the codePost system. Users can be added to the organization by adding there email to a course. A user will automaitcally be created next time they sign-in. If an Organization uses SSO, codePost assumes SSO handles user authentication.

## Managing Courses

The **Courses** tab lists all courses within your organization.

### Creating and Editing Courses

You can manage specific settings for each course:

- **Basic Info:** Name, Period (e.g., Fall 2023), Timezone, and Archive status.
- **Settings:**
  - **Email New Users:** Toggle whether new students receive welcome emails.
  - **Invite Code:** Enable/Disable and reset the invite code for student self-registration.
  - **Students Can See Graders:** Toggle visibility of grader identities.
- **Grading:** Configure anonymous grading defaults and rubric editing permissions.

## Organization Settings

The **Settings** tab allows you to configure global preferences, particularly security and integrations.

### Email Settings

- **Allowed Email Domain:** Restrict organization membership to a specific email domain (e.g., `university.edu`).

  > [!IMPORTANT]
  > Email Domain is used to create new users via SSO, please make sure that your users Email Domain is valid and an email to that user via a domain is delieverable.

- **Send Welcome Emails:** Toggle whether users added via roster upload receive welcome emails by default.

### Single Sign-On (SSO)

You can configure SSO to allow users to log in with your university or corporate credentials. Supported providers include:

- **CAS:** Central Authentication Service (requires Server URL and Version).
- **Azure AD:** Requires Tenant ID, Client ID, and Client Secret.
- **OIDC:** OpenID Connect (requires Discovery URL).
- **Google Workspace:** Google OAuth integration.

Enable **SSO Activation** to automatically activate new users who log in via SSO.

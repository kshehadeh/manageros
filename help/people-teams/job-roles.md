# Job Roles and Organizational Structure

## Overview

Job Roles provide structured definitions of positions within your organization. They combine job levels, domains, and detailed descriptions to create a comprehensive organizational hierarchy.

## Key Concepts

### Job Levels

Job levels represent seniority within your organization and can be organized in a hierarchy:

- **Junior** - Entry-level positions (order: 0)
- **Professional** - Individual contributors (order: 1)
- **Senior Professional** - Experienced individual contributors (order: 2)
- **Staff** - Senior contributors with mentoring responsibilities (order: 3)
- **Principal** - Technical leaders and architecture (order: 4)

**Level Ordering**: Job levels are displayed in order from lowest to highest. This order determines how levels appear in selection dropdowns and helps establish clear career progression paths.

### Job Domains

Job domains represent functional areas:

- **Engineering** - Software development and technical roles
- **Product** - Product management and strategy
- **Design** - User experience and visual design
- **Marketing** - Marketing and communications

### Job Roles

Job roles combine levels and domains into specific positions:

- **Senior Software Engineer** (Senior Level, Engineering Domain)
- **Product Manager** (Multiple Levels, Product Domain)
- **UX Designer** (Multiple Levels, Design Domain)

## Managing Job Roles

### As an Administrator

1. **Navigate to Organization Settings**
   - Go to Organization Settings in the sidebar (admin only)
   - Find the "Job Role Management" section

2. **Create Job Levels**
   - Click "Add Level" in the Job Levels section
   - Enter level name (e.g., "Senior", "Staff")
   - Click "Create" to save
   - New levels automatically receive the next order number

3. **Order Job Levels**
   - Drag and drop levels to reorder them
   - Order numbers automatically update based on position
   - Levels appear in selection dropdowns based on their order
   - Use the grip handle (⋮⋮) to drag levels up or down

4. **Create Job Domains**
   - Click "Add Domain" in the Job Domains section
   - Enter domain name (e.g., "Engineering", "Product")
   - Click "Create" to save

5. **Create Job Roles**
   - Click "Add Job Role" in the Job Roles section
   - Fill in the job title (e.g., "Senior Software Engineer")
   - Select a level from the dropdown
   - Select a domain from the dropdown
   - Write a job description using markdown
   - Click "Create" to save

### Editing and Deleting

- **Edit**: Click the "Edit" button next to any level, domain, or role
- **Delete**: Click the "Delete" button (only allowed if no roles/people are assigned)
- **Safety**: You cannot delete levels or domains that have job roles assigned, or job roles that have people assigned

### Drag-and-Drop Ordering

Job levels support intuitive drag-and-drop reordering:

- **Visual Indicators**: Each level shows a grip handle (⋮⋮) for dragging
- **Smooth Animation**: Visual feedback during drag operations with shadow effects
- **Automatic Persistence**: New order is automatically saved to the database
- **Real-time Updates**: Changes reflect immediately in job role forms and selections

**Tip**: Lower order numbers appear first in dropdown menus, so place junior roles at the top and senior roles at the bottom.

## Assigning Job Roles to People

### Creating New People

1. Navigate to People → Add Person
2. Fill in basic information
3. In the "Job Role" section, select a role from the dropdown
4. Save the person

### Editing Existing People

1. Go to People table and click "Edit" on a person
2. In the "Job Role" section, select a role from the dropdown
3. Save changes

## Job Descriptions

Job descriptions support markdown formatting:

```markdown
### Responsibilities

- Design and implement software solutions
- Mentor junior team members
- Collaborate with product and design teams

### Requirements

- **Experience**: 5+ years in software development
- **Skills**: React, TypeScript, Node.js
- **Education**: Computer Science degree or equivalent

### Preferred Qualifications

- Previous startup experience
- Knowledge of cloud platforms
- Experience with mobile development
```

## Best Practices

### Setting Up Job Roles

1. **Start with Levels**: Define the organizational hierarchy first
2. **Map Domains**: Identify functional areas in your organization
3. **Create Roles**: Combine levels and domains for specific positions
4. **Write Descriptions**: Include responsibilities, requirements, and growth opportunities

### Maintaining Consistency

1. **Regular Reviews**: Periodically review and update job roles
2. **Clear Descriptions**: Keep job descriptions current and detailed
3. **Aligned Grading**: Ensure levels align with your compensation philosophy
4. **Domain Clarity**: Make sure domains reflect actual organizational structure

## Viewing Job Role Information

### In the People Table

- Job roles appear in a dedicated "Job Role" column
- Shows role title with level and domain information
- Displays as "—" for people without assigned roles

### In Person Details

- Full job role information visible when viewing individual person profiles
- Includes full job description with markdown formatting
- Shows who else has the same job role

## Common Use Cases

### Career Development

- **Growth Planning**: Use levels to plan career progression
- **Skill Mapping**: Link job descriptions to development areas
- **Cross-Domain**: Track movement between different functional areas

### Organizational Analysis

- **Role Distribution**: See how roles are distributed across the organization
- **Level Breakdown**: Understand the seniority distribution
- **Domain Balance**: Ensure balanced representation across functional areas

### Recruitment

- **Clear Roles**: Provide specific job descriptions for new hires
- **Role Mapping**: Help candidates understand organizational structure
- **Expectations**: Set clear expectations about responsibilities and growth

## FAQs

**Q: Can one person have multiple job roles?**
A: No, each person can only have one job role assigned. This ensures clarity about their primary role and responsibilities.

**Q: Can I change a person's job role?**
A: Yes, administrators can edit a person's job role assignment at any time through the person edit form.

**Q: What happens if I delete a job role that has people assigned?**
A: You cannot delete job roles that have people assigned. You must first reassign or remove the people from that role.

**Q: How do I handle promotions?**
A: Update the person's job role to reflect their new level and responsibilities. You can also update the job role description if needed.

**Q: Can I see who else has the same job role?**
A: Yes, the job role management interface shows all people assigned to each role.

## Need Help?

If you need assistance with job role management:

1. Check the main [People documentation](../../README.md)
2. Contact your organization administrator
3. Review organization settings for proper permissions

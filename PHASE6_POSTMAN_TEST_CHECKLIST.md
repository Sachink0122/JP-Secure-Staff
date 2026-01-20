# Phase 6 - HR Module Postman Test Checklist

## Prerequisites

1. **Master Admin User:**
   - Email: `admin@jpsecurestaff.com`
   - Password: `Admin@123456`

2. **HR User:**
   - Create HR department
   - Create HR role with permissions: `HR_DOCUMENT_GENERATE`, `HR_DOCUMENT_UPLOAD`, `HR_DOCUMENT_READ`, `HR_COMPLETE`
   - Create HR user in HR department

3. **Test Person:**
   - Create person in OPERATION_STAGE_A
   - Submit to Finance (status: FINANCE_STAGE)
   - Complete Finance (status: FINANCE_COMPLETED)
   - Assign Employee Code (status: EMPLOYEE_CODE_ASSIGNED)

4. **Templates:**
   - Create OFFER_LETTER template
   - Create DECLARATION template
   - Publish both templates

---

## Test Cases

### 1. Authentication & Authorization

#### Test 1.1: Unauthenticated Access
```
POST http://localhost:5000/api/persons/:id/hr/generate
(No Authorization header)
```
**Expected:** HTTP 401 - No token provided

#### Test 1.2: Missing Permission
```
POST http://localhost:5000/api/persons/:id/hr/generate
Authorization: Bearer <token_without_HR_DOCUMENT_GENERATE>
```
**Expected:** HTTP 403 - Insufficient permissions

#### Test 1.3: Non-HR Department User
```
POST http://localhost:5000/api/persons/:id/hr/generate
Authorization: Bearer <operation_user_token>
```
**Expected:** HTTP 403 - Only users from HR department can perform this action

#### Test 1.4: HR User with Permission
```
POST http://localhost:5000/api/persons/:id/hr/generate
Authorization: Bearer <hr_user_token>
Content-Type: application/json

{
  "documentType": "OFFER_LETTER",
  "templateId": "<published_template_id>"
}
```
**Expected:** HTTP 200 - Document generated successfully

---

### 2. Generate HR Document

#### Test 2.1: Generate Offer Letter (Valid)
```
POST http://localhost:5000/api/persons/:id/hr/generate
Authorization: Bearer <hr_user_token>
Content-Type: application/json

{
  "documentType": "OFFER_LETTER",
  "templateId": "<published_offer_letter_template_id>"
}
```
**Expected:** 
- HTTP 200
- Status changes to HR_STAGE (if was EMPLOYEE_CODE_ASSIGNED)
- offerLetter.generatedFile set
- offerLetter.status = "GENERATED"
- Audit log: HR_DOCUMENT_GENERATED

#### Test 2.2: Generate Declaration (Valid)
```
POST http://localhost:5000/api/persons/:id/hr/generate
Authorization: Bearer <hr_user_token>
Content-Type: application/json

{
  "documentType": "DECLARATION",
  "templateId": "<published_declaration_template_id>"
}
```
**Expected:** HTTP 200 - Declaration generated

#### Test 2.3: Generate with Unpublished Template
```
POST http://localhost:5000/api/persons/:id/hr/generate
Authorization: Bearer <hr_user_token>
Content-Type: application/json

{
  "documentType": "OFFER_LETTER",
  "templateId": "<unpublished_template_id>"
}
```
**Expected:** HTTP 400 - Template is not published

#### Test 2.4: Generate with Wrong Template Type
```
POST http://localhost:5000/api/persons/:id/hr/generate
Authorization: Bearer <hr_user_token>
Content-Type: application/json

{
  "documentType": "OFFER_LETTER",
  "templateId": "<declaration_template_id>"
}
```
**Expected:** HTTP 400 - Template type does not match document type

#### Test 2.5: Duplicate Generation
```
POST http://localhost:5000/api/persons/:id/hr/generate
(Generate same document twice)
```
**Expected:** HTTP 409 - Document has already been generated

#### Test 2.6: Generate with Wrong Status
```
POST http://localhost:5000/api/persons/:id/hr/generate
(Person status is FINANCE_STAGE)
```
**Expected:** HTTP 400 - Only persons with status EMPLOYEE_CODE_ASSIGNED or later

---

### 3. Upload Signed HR Document

#### Test 3.1: Upload Signed Offer Letter (Valid)
```
POST http://localhost:5000/api/persons/:id/hr/upload
Authorization: Bearer <hr_user_token>
Content-Type: application/json

{
  "documentType": "OFFER_LETTER",
  "signedFile": "/uploads/hr/signed/offer_letter_signed.pdf"
}
```
**Expected:**
- HTTP 200
- offerLetter.signedFile set
- offerLetter.status = "SIGNED"
- offerLetter.signedAt set
- Audit log: HR_DOCUMENT_SIGNED

#### Test 3.2: Upload Signed Declaration (Valid)
```
POST http://localhost:5000/api/persons/:id/hr/upload
Authorization: Bearer <hr_user_token>
Content-Type: application/json

{
  "documentType": "DECLARATION",
  "signedFile": "/uploads/hr/signed/declaration_signed.pdf"
}
```
**Expected:** HTTP 200 - Declaration signed

#### Test 3.3: Upload Without Generation
```
POST http://localhost:5000/api/persons/:id/hr/upload
(Document not generated yet)
```
**Expected:** HTTP 400 - Document must be generated before uploading signed version

#### Test 3.4: Duplicate Signing
```
POST http://localhost:5000/api/persons/:id/hr/upload
(Document already signed)
```
**Expected:** HTTP 409 - Document has already been signed

#### Test 3.5: Upload with Wrong Status
```
POST http://localhost:5000/api/persons/:id/hr/upload
(Person status is FINANCE_STAGE)
```
**Expected:** HTTP 400 - Only persons with status EMPLOYEE_CODE_ASSIGNED or later

---

### 4. View HR Documents

#### Test 4.1: View HR Documents (HR User)
```
GET http://localhost:5000/api/persons/:id/hr/documents
Authorization: Bearer <hr_user_token>
```
**Expected:**
- HTTP 200
- Returns offerLetter and declaration details
- Returns hrCompleted status

#### Test 4.2: View HR Documents (Non-HR User with Permission)
```
GET http://localhost:5000/api/persons/:id/hr/documents
Authorization: Bearer <operation_user_token_with_HR_DOCUMENT_READ>
```
**Expected:** HTTP 200 - Read-only access (visibility rule)

#### Test 4.3: View Before EMPLOYEE_CODE_ASSIGNED
```
GET http://localhost:5000/api/persons/:id/hr/documents
(Person status is FINANCE_STAGE)
```
**Expected:** HTTP 403 - Person profile is not visible

---

### 5. Complete HR

#### Test 5.1: Complete HR (Valid - Both Documents Signed)
```
POST http://localhost:5000/api/persons/:id/hr/complete
Authorization: Bearer <hr_user_token>
```
**Expected:**
- HTTP 200
- Status changes to HR_COMPLETED
- hrDetails.hrCompleted = true
- hrDetails.hrCompletedAt set
- Status history updated
- Audit log: HR_COMPLETED

#### Test 5.2: Complete HR with Missing Signatures
```
POST http://localhost:5000/api/persons/:id/hr/complete
(One or both documents not signed)
```
**Expected:** HTTP 400 - All HR documents must be signed, missingSignatures array

#### Test 5.3: Complete HR Without Employee Code
```
POST http://localhost:5000/api/persons/:id/hr/complete
(Person has no employee code)
```
**Expected:** HTTP 400 - Employee code must be assigned

#### Test 5.4: Complete HR Without Finance Completion
```
POST http://localhost:5000/api/persons/:id/hr/complete
(Finance not completed)
```
**Expected:** HTTP 400 - Finance KYC must be completed

#### Test 5.5: Duplicate Completion
```
POST http://localhost:5000/api/persons/:id/hr/complete
(HR already completed)
```
**Expected:** HTTP 409 - HR has already been completed

#### Test 5.6: Complete with Wrong Status
```
POST http://localhost:5000/api/persons/:id/hr/complete
(Person status is FINANCE_STAGE)
```
**Expected:** HTTP 400 - Only persons with status EMPLOYEE_CODE_ASSIGNED or HR_STAGE

---

### 6. Edit Locking

#### Test 6.1: Operation User Attempts HR Action
```
POST http://localhost:5000/api/persons/:id/hr/generate
Authorization: Bearer <operation_user_token>
(Person status is HR_STAGE)
```
**Expected:** HTTP 403 - Operation department cannot edit persons in HR_STAGE stage
**Audit:** HR_UPDATE_ATTEMPT_DENIED logged

#### Test 6.2: Finance User Attempts HR Action
```
POST http://localhost:5000/api/persons/:id/hr/generate
Authorization: Bearer <finance_user_token>
(Person status is HR_STAGE)
```
**Expected:** HTTP 403 - Finance department cannot edit persons in HR_STAGE stage
**Audit:** HR_UPDATE_ATTEMPT_DENIED logged

#### Test 6.3: HR User Attempts Edit After Completion
```
POST http://localhost:5000/api/persons/:id/hr/generate
Authorization: Bearer <hr_user_token>
(Person status is HR_COMPLETED)
```
**Expected:** HTTP 403 - HR cannot edit persons after HR completion

---

### 7. Visibility Rules

#### Test 7.1: View Profile After EMPLOYEE_CODE_ASSIGNED
```
GET http://localhost:5000/api/persons/:id
Authorization: Bearer <any_user_token_with_PERSON_READ>
(Person status is EMPLOYEE_CODE_ASSIGNED)
```
**Expected:** HTTP 200 - Profile visible (read-only)

#### Test 7.2: View Profile in HR_STAGE
```
GET http://localhost:5000/api/persons/:id
Authorization: Bearer <any_user_token_with_PERSON_READ>
(Person status is HR_STAGE)
```
**Expected:** HTTP 200 - Profile visible (read-only)

#### Test 7.3: View Profile in HR_COMPLETED
```
GET http://localhost:5000/api/persons/:id
Authorization: Bearer <any_user_token_with_PERSON_READ>
(Person status is HR_COMPLETED)
```
**Expected:** HTTP 200 - Profile visible (read-only)

---

### 8. Workflow Validation

#### Test 8.1: Status Progression
1. Create person → OPERATION_STAGE_A
2. Submit to Finance → FINANCE_STAGE
3. Complete Finance → FINANCE_COMPLETED
4. Assign Employee Code → EMPLOYEE_CODE_ASSIGNED
5. Generate HR document → HR_STAGE
6. Complete HR → HR_COMPLETED

**Expected:** All transitions succeed in order

#### Test 8.2: Backward Movement Blocked
```
POST http://localhost:5000/api/persons/:id/hr/complete
(Person status is OPERATION_STAGE_A)
```
**Expected:** HTTP 400 - Invalid status

---

### 9. Audit Logging

#### Test 9.1: Verify HR_DOCUMENT_GENERATED Log
```
GET http://localhost:5000/api/admin/audit?action=HR_DOCUMENT_GENERATED
Authorization: Bearer <master_admin_token>
```
**Expected:** 
- Audit log entry exists
- Contains: performedBy, personId, documentType, templateId
- Contains: IP address, user-agent, timestamp

#### Test 9.2: Verify HR_DOCUMENT_SIGNED Log
```
GET http://localhost:5000/api/admin/audit?action=HR_DOCUMENT_SIGNED
Authorization: Bearer <master_admin_token>
```
**Expected:** Audit log entry with all required fields

#### Test 9.3: Verify HR_COMPLETED Log
```
GET http://localhost:5000/api/admin/audit?action=HR_COMPLETED
Authorization: Bearer <master_admin_token>
```
**Expected:** Audit log entry with status transition

#### Test 9.4: Verify HR_UPDATE_ATTEMPT_DENIED Log
```
GET http://localhost:5000/api/admin/audit?action=HR_UPDATE_ATTEMPT_DENIED
Authorization: Bearer <master_admin_token>
```
**Expected:** Audit log entry for denied attempts

---

## Test Data Setup

### Create HR Department
```
POST http://localhost:5000/api/admin/departments
Authorization: Bearer <master_admin_token>
Content-Type: application/json

{
  "name": "Human Resources",
  "code": "HR",
  "isActive": true
}
```

### Create HR Role
```
POST http://localhost:5000/api/admin/roles
Authorization: Bearer <master_admin_token>
Content-Type: application/json

{
  "name": "HR Staff",
  "permissions": [
    "<HR_DOCUMENT_GENERATE_ID>",
    "<HR_DOCUMENT_UPLOAD_ID>",
    "<HR_DOCUMENT_READ_ID>",
    "<HR_COMPLETE_ID>",
    "<PERSON_READ_ID>"
  ]
}
```

### Create HR User
```
POST http://localhost:5000/api/admin/users
Authorization: Bearer <master_admin_token>
Content-Type: application/json

{
  "fullName": "HR Staff",
  "email": "hr@jpsecurestaff.com",
  "password": "Hr@123456",
  "department": "<HR_DEPARTMENT_ID>",
  "role": "<HR_ROLE_ID>",
  "isActive": true
}
```

### Create Templates
```
POST http://localhost:5000/api/admin/templates
Authorization: Bearer <master_admin_token>
Content-Type: application/json

{
  "name": "Offer Letter Template",
  "type": "OFFER_LETTER",
  "content": "Template content here...",
  "isPublished": true
}
```

---

## Success Criteria

- ✅ All test cases pass
- ✅ No role-name checks in code
- ✅ Permission-based authorization only
- ✅ Department validation enforced
- ✅ Edit locking working correctly
- ✅ Visibility rules enforced
- ✅ Audit logs created for all actions
- ✅ Status transitions correct
- ✅ No backward workflow movement

---

## Notes

- Replace `<token>`, `<id>`, etc. with actual values
- Ensure test person progresses through all stages
- Verify audit logs after each action
- Check status transitions in person record


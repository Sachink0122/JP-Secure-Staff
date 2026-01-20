/**
 * Finance Controller
 * Handles Finance module operations (Phase 5)
 * Finance KYC, completion, and employee code assignment
 */

const Person = require('../models/Person');
const Department = require('../models/Department');
const { logPersonAction } = require('../services/auditService');
const logger = require('../utils/logger');

/**
 * Helper: Check if user belongs to Finance department
 */
const checkFinanceDepartment = async (userDepartmentId) => {
  const financeDepartment = await Department.findOne({
    $or: [
      { code: 'FINANCE' },
      { name: { $regex: /^finance$/i } }
    ]
  });

  if (!financeDepartment) {
    return { valid: false, error: 'Finance department not found. Please contact administrator.', department: null };
  }

  const userDepartment = await Department.findById(userDepartmentId);
  if (!userDepartment) {
    return { valid: false, error: 'User department not found', department: null };
  }

  if (userDepartment._id.toString() !== financeDepartment._id.toString()) {
    return { valid: false, error: 'Only users from Finance department can perform this action', department: null };
  }

  return { valid: true, error: null, department: financeDepartment };
};

/**
 * Helper: Check if Operation/HR user trying to edit Finance-stage person
 */
const checkEditLock = async (person, userDepartmentId, req) => {
  const userDepartment = await Department.findById(userDepartmentId);
  if (!userDepartment) {
    return { locked: false, error: null };
  }

  // Check if person is in Finance stage or later
  const financeStages = ['FINANCE_STAGE', 'FINANCE_COMPLETED', 'EMPLOYEE_CODE_ASSIGNED'];
  
  if (financeStages.includes(person.currentStatus)) {
    // Check if user is from Operation or HR
    const operationDepartment = await Department.findOne({
      $or: [
        { code: 'OPERATION' },
        { name: { $regex: /^operation$/i } }
      ]
    });

    const hrDepartment = await Department.findOne({
      $or: [
        { code: 'HR' },
        { name: { $regex: /^hr$/i } }
      ]
    });

    const isOperation = operationDepartment && userDepartment._id.toString() === operationDepartment._id.toString();
    const isHR = hrDepartment && userDepartment._id.toString() === hrDepartment._id.toString();

    if (isOperation || isHR) {
      // Audit log denied attempt
      await logPersonAction(
        'FINANCE_UPDATE_ATTEMPT_DENIED',
        req.user.userId,
        person._id,
        {
          attemptedBy: req.user.userId,
          userDepartment: userDepartment.name,
          personStatus: person.currentStatus,
          reason: `${userDepartment.name} department cannot edit persons in ${person.currentStatus} stage`
        },
        {},
        req
      );

      return {
        locked: true,
        error: `${userDepartment.name} department cannot edit persons in ${person.currentStatus} stage`
      };
    }
  }

  return { locked: false, error: null };
};

/**
 * Update Finance Details
 * PUT /api/persons/:id/finance
 */
const updateFinanceDetails = async (req, res, next) => {
  try {
    const personId = req.params.id;
    const {
      bankName,
      accountHolderName,
      accountNumber,
      ifscCode,
      panNumber,
      paymentMode,
      salaryType,
      salaryAmount,
      financeRemarks,
      bankProof,
      panCard,
      salaryStructure
    } = req.body;

    // Find person
    const person = await Person.findById(personId)
      .populate('owningDepartment', 'name code');

    if (!person) {
      return res.status(404).json({
        success: false,
        error: 'Person not found'
      });
    }

    // Check edit lock (Operation/HR cannot edit)
    const lockCheck = await checkEditLock(person, req.user.departmentId, req);
    if (lockCheck.locked) {
      return res.status(403).json({
        success: false,
        error: lockCheck.error
      });
    }

    // Check user is from Finance department
    const financeCheck = await checkFinanceDepartment(req.user.departmentId);
    if (!financeCheck.valid) {
      return res.status(403).json({
        success: false,
        error: financeCheck.error
      });
    }

    // Validate person status
    if (person.currentStatus !== 'FINANCE_STAGE') {
      return res.status(400).json({
        success: false,
        error: `Cannot update finance details. Person status is ${person.currentStatus}. Only persons in FINANCE_STAGE can be updated.`
      });
    }

    // Prevent update if KYC already completed
    if (person.financeDetails && person.financeDetails.kycCompleted === true) {
      return res.status(400).json({
        success: false,
        error: 'Cannot update finance details. KYC has already been completed. Use completion endpoint to proceed.'
      });
    }

    // Store previous values for audit
    const previousValues = {
      financeDetails: person.financeDetails ? { ...person.financeDetails.toObject() } : {},
      financeDocuments: person.financeDocuments ? { ...person.financeDocuments.toObject() } : {}
    };

    // Update finance details
    if (!person.financeDetails) {
      person.financeDetails = {};
    }

    if (bankName !== undefined) person.financeDetails.bankName = bankName ? bankName.trim() : null;
    if (accountHolderName !== undefined) person.financeDetails.accountHolderName = accountHolderName ? accountHolderName.trim() : null;
    if (accountNumber !== undefined) person.financeDetails.accountNumber = accountNumber ? accountNumber.trim() : null;
    if (ifscCode !== undefined) person.financeDetails.ifscCode = ifscCode ? ifscCode.trim().toUpperCase() : null;
    if (panNumber !== undefined) person.financeDetails.panNumber = panNumber ? panNumber.trim().toUpperCase() : null;
    if (paymentMode !== undefined) person.financeDetails.paymentMode = paymentMode;
    if (salaryType !== undefined) person.financeDetails.salaryType = salaryType;
    if (salaryAmount !== undefined) person.financeDetails.salaryAmount = salaryAmount;
    if (financeRemarks !== undefined) person.financeDetails.financeRemarks = financeRemarks ? financeRemarks.trim() : null;

    // Update finance documents
    if (!person.financeDocuments) {
      person.financeDocuments = {};
    }

    if (bankProof !== undefined) person.financeDocuments.bankProof = bankProof ? bankProof.trim() : null;
    if (panCard !== undefined) person.financeDocuments.panCard = panCard ? panCard.trim() : null;
    if (salaryStructure !== undefined) person.financeDocuments.salaryStructure = salaryStructure ? salaryStructure.trim() : null;

    await person.save();

    const updatedPerson = await Person.findById(person._id)
      .populate('owningDepartment', 'name code')
      .populate('createdBy', 'fullName email');

    // Audit log
    await logPersonAction(
      'FINANCE_DETAILS_UPDATED',
      req.user.userId,
      person._id,
      {
        previousValues,
        newValues: {
          financeDetails: person.financeDetails,
          financeDocuments: person.financeDocuments
        }
      },
      {},
      req
    );

    logger.info(`Finance details updated for person ${person.email} (${person._id}) by user ${req.user.userId}`);

    res.status(200).json({
      success: true,
      data: { person: updatedPerson },
      message: 'Finance details updated successfully'
    });
  } catch (error) {
    logger.error('Update finance details error:', error);
    next(error);
  }
};

/**
 * Complete Finance KYC
 * POST /api/persons/:id/finance/complete
 */
const completeFinance = async (req, res, next) => {
  try {
    const personId = req.params.id;

    // Find person
    const person = await Person.findById(personId)
      .populate('owningDepartment', 'name code');

    if (!person) {
      return res.status(404).json({
        success: false,
        error: 'Person not found'
      });
    }

    // Check user is from Finance department
    const financeCheck = await checkFinanceDepartment(req.user.departmentId);
    if (!financeCheck.valid) {
      return res.status(403).json({
        success: false,
        error: financeCheck.error
      });
    }

    // Validate person status
    if (person.currentStatus !== 'FINANCE_STAGE') {
      return res.status(400).json({
        success: false,
        error: `Cannot complete finance. Person status is ${person.currentStatus}. Only persons in FINANCE_STAGE can be completed.`
      });
    }

    // Prevent duplicate completion
    if (person.financeDetails && person.financeDetails.kycCompleted === true) {
      return res.status(409).json({
        success: false,
        error: 'Finance KYC has already been completed for this person'
      });
    }

    // Validate all required finance fields
    const requiredFields = [
      'bankName',
      'accountHolderName',
      'accountNumber',
      'ifscCode',
      'panNumber',
      'paymentMode',
      'salaryType',
      'salaryAmount'
    ];

    const missingFields = [];
    if (!person.financeDetails) {
      missingFields.push(...requiredFields);
    } else {
      for (const field of requiredFields) {
        if (!person.financeDetails[field] || (typeof person.financeDetails[field] === 'string' && !person.financeDetails[field].trim())) {
          missingFields.push(field);
        }
      }
    }

    // Validate required documents
    const requiredDocuments = ['bankProof', 'panCard', 'salaryStructure'];
    const missingDocuments = [];
    if (!person.financeDocuments) {
      missingDocuments.push(...requiredDocuments);
    } else {
      for (const doc of requiredDocuments) {
        if (!person.financeDocuments[doc] || !person.financeDocuments[doc].trim()) {
          missingDocuments.push(doc);
        }
      }
    }

    if (missingFields.length > 0 || missingDocuments.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot complete finance. Missing required fields or documents.',
        missingFields,
        missingDocuments
      });
    }

    // Store previous status for audit
    const previousStatus = person.currentStatus;

    // Complete finance
    person.financeDetails.kycCompleted = true;
    person.financeDetails.completedAt = new Date();
    person.currentStatus = 'FINANCE_COMPLETED';

    // Append to status history
    person.statusHistory.push({
      status: 'FINANCE_COMPLETED',
      changedBy: req.user.userId,
      changedAt: new Date()
    });

    await person.save();

    const updatedPerson = await Person.findById(person._id)
      .populate('owningDepartment', 'name code')
      .populate('createdBy', 'fullName email')
      .populate('statusHistory.changedBy', 'fullName email');

    // Audit log
    await logPersonAction(
      'FINANCE_COMPLETED',
      req.user.userId,
      person._id,
      {
        previousStatus,
        newStatus: 'FINANCE_COMPLETED',
        completedAt: person.financeDetails.completedAt,
        kycCompleted: true
      },
      {},
      req
    );

    logger.info(`Finance KYC completed for person ${person.email} (${person._id}) by user ${req.user.userId}`);

    res.status(200).json({
      success: true,
      data: { person: updatedPerson },
      message: 'Finance KYC completed successfully'
    });
  } catch (error) {
    logger.error('Complete finance error:', error);
    next(error);
  }
};

/**
 * Assign Employee Code
 * POST /api/persons/:id/finance/assign-employee-code
 */
const assignEmployeeCode = async (req, res, next) => {
  try {
    const personId = req.params.id;

    // Find person
    const person = await Person.findById(personId)
      .populate('owningDepartment', 'name code');

    if (!person) {
      return res.status(404).json({
        success: false,
        error: 'Person not found'
      });
    }

    // Check user is from Finance department
    const financeCheck = await checkFinanceDepartment(req.user.departmentId);
    if (!financeCheck.valid) {
      return res.status(403).json({
        success: false,
        error: financeCheck.error
      });
    }

    // Validate person status
    if (person.currentStatus !== 'FINANCE_COMPLETED') {
      return res.status(400).json({
        success: false,
        error: `Cannot assign employee code. Person status is ${person.currentStatus}. Only persons with status FINANCE_COMPLETED can be assigned employee code.`
      });
    }

    // Prevent duplicate assignment
    if (person.employeeCode) {
      return res.status(409).json({
        success: false,
        error: `Employee code has already been assigned: ${person.employeeCode}`
      });
    }

    // Generate unique employee code
    const year = new Date().getFullYear();
    let employeeCode;
    let attempts = 0;
    const maxAttempts = 1000000; // Allow up to 1 million attempts

    // Find the highest existing employee code for this year
    const existingCodes = await Person.find({
      employeeCode: { $regex: `^JP-EMP-${year}-` }
    })
      .select('employeeCode')
      .sort({ employeeCode: -1 })
      .limit(1);

    let sequence = 1;
    if (existingCodes.length > 0 && existingCodes[0].employeeCode) {
      // Extract sequence number from existing code
      const match = existingCodes[0].employeeCode.match(/-(\d+)$/);
      if (match) {
        sequence = parseInt(match[1], 10) + 1;
      }
    }

    // Generate code and check for uniqueness
    do {
      employeeCode = `JP-EMP-${year}-${String(sequence).padStart(6, '0')}`;
      
      // Check if code already exists (safety check)
      const existing = await Person.findOne({ employeeCode });
      if (!existing) {
        break;
      }
      
      sequence++;
      attempts++;
      if (attempts >= maxAttempts) {
        return res.status(500).json({
          success: false,
          error: 'Failed to generate unique employee code. Please try again.'
        });
      }
    } while (true);

    // Store previous status for audit
    const previousStatus = person.currentStatus;

    // Assign employee code
    person.employeeCode = employeeCode;
    person.employeeCodeAssignedAt = new Date();
    person.employeeCodeAssignedBy = req.user.userId;
    person.currentStatus = 'EMPLOYEE_CODE_ASSIGNED';

    // Append to status history
    person.statusHistory.push({
      status: 'EMPLOYEE_CODE_ASSIGNED',
      changedBy: req.user.userId,
      changedAt: new Date()
    });

    await person.save();

    const updatedPerson = await Person.findById(person._id)
      .populate('owningDepartment', 'name code')
      .populate('createdBy', 'fullName email')
      .populate('employeeCodeAssignedBy', 'fullName email')
      .populate('statusHistory.changedBy', 'fullName email');

    // Audit log
    await logPersonAction(
      'EMPLOYEE_CODE_ASSIGNED',
      req.user.userId,
      person._id,
      {
        previousStatus,
        newStatus: 'EMPLOYEE_CODE_ASSIGNED',
        employeeCode,
        assignedAt: person.employeeCodeAssignedAt,
        assignedBy: req.user.userId
      },
      {},
      req
    );

    logger.info(`Employee code ${employeeCode} assigned to person ${person.email} (${person._id}) by user ${req.user.userId}`);

    res.status(200).json({
      success: true,
      data: { person: updatedPerson },
      message: `Employee code ${employeeCode} assigned successfully`
    });
  } catch (error) {
    // Handle duplicate key error for employeeCode
    if (error.code === 11000 && error.keyPattern && error.keyPattern.employeeCode) {
      return res.status(409).json({
        success: false,
        error: 'Employee code already exists. Please try again.'
      });
    }

    logger.error('Assign employee code error:', error);
    next(error);
  }
};

module.exports = {
  updateFinanceDetails,
  completeFinance,
  assignEmployeeCode
};


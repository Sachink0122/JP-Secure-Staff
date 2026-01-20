/**
 * Person Controller
 * Handles person management logic for Operation Stage-A
 */

const Person = require('../models/Person');
const Department = require('../models/Department');
const { logPersonAction } = require('../services/auditService');
const logger = require('../utils/logger');

/**
 * Create person (Stage-A)
 * POST /api/persons
 */
const createPerson = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      primaryMobile,
      alternateMobile,
      employmentType,
      companyName,
      category,
      experience,
      currentLocation,
      cvFile,
      qualificationCertificates,
      ndtCertificate
    } = req.body;

    // Check if user is from Operation department
    const userDepartment = await Department.findById(req.user.departmentId);
    if (!userDepartment) {
      return res.status(400).json({
        success: false,
        error: 'User department not found'
      });
    }

    // Check if department is Operation (by code or name)
    const operationDepartment = await Department.findOne({
      $or: [
        { code: 'OPERATION' },
        { name: { $regex: /^operation$/i } }
      ]
    });

    if (!operationDepartment) {
      return res.status(400).json({
        success: false,
        error: 'Operation department not found. Please contact administrator.'
      });
    }

    // Check if user's department is Operation
    if (userDepartment._id.toString() !== operationDepartment._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Only users from Operation department can create Stage-A persons'
      });
    }

    // Check for duplicate email
    const existingByEmail = await Person.findOne({ email: email.toLowerCase() });
    if (existingByEmail) {
      // Audit log duplicate attempt
      await logPersonAction(
        'PERSON_DUPLICATE_ATTEMPT',
        req.user.userId,
        existingByEmail._id,
        { attemptedEmail: email.toLowerCase() },
        { reason: 'Email already exists' },
        req
      );

      return res.status(400).json({
        success: false,
        error: 'Person with this email already exists'
      });
    }

    // Check for duplicate primary mobile
    const existingByMobile = await Person.findOne({ primaryMobile });
    if (existingByMobile) {
      // Audit log duplicate attempt
      await logPersonAction(
        'PERSON_DUPLICATE_ATTEMPT',
        req.user.userId,
        existingByMobile._id,
        { attemptedMobile: primaryMobile },
        { reason: 'Primary mobile already exists' },
        req
      );

      return res.status(400).json({
        success: false,
        error: 'Person with this primary mobile already exists'
      });
    }

    // Validate alternate mobile is different from primary
    if (alternateMobile && alternateMobile === primaryMobile) {
      return res.status(400).json({
        success: false,
        error: 'Alternate mobile must be different from primary mobile'
      });
    }

    // Document validation
    if (!cvFile || !cvFile.trim()) {
      await logPersonAction(
        'PERSON_DOCUMENT_VALIDATION_FAILED',
        req.user.userId,
        null,
        {},
        { reason: 'CV file is missing' },
        req
      );

      return res.status(400).json({
        success: false,
        error: 'CV file is required'
      });
    }

    if (!qualificationCertificates || !Array.isArray(qualificationCertificates) || qualificationCertificates.length === 0) {
      await logPersonAction(
        'PERSON_DOCUMENT_VALIDATION_FAILED',
        req.user.userId,
        null,
        {},
        { reason: 'At least one qualification certificate is required' },
        req
      );

      return res.status(400).json({
        success: false,
        error: 'At least one qualification certificate is required'
      });
    }

    // NDT certificate validation
    if (category === 'MECHANICAL' && (!ndtCertificate || !ndtCertificate.trim())) {
      await logPersonAction(
        'PERSON_DOCUMENT_VALIDATION_FAILED',
        req.user.userId,
        null,
        {},
        { reason: 'NDT certificate is required for MECHANICAL category' },
        req
      );

      return res.status(400).json({
        success: false,
        error: 'NDT certificate is required for MECHANICAL category'
      });
    }

    // Prepare NDT certificate value
    let ndtCertValue = null;
    if (category === 'MECHANICAL') {
      ndtCertValue = ndtCertificate ? ndtCertificate.trim() : null;
    }
    // For non-mechanical categories, ndtCertValue remains null

    // Create person
    const person = await Person.create({
      fullName: fullName.trim(),
      email: email.toLowerCase(),
      primaryMobile,
      alternateMobile: alternateMobile || null,
      employmentType,
      companyName: companyName ? companyName.trim() : null,
      category,
      experience: experience ? experience.trim() : null,
      currentLocation: currentLocation ? currentLocation.trim() : null,
      cvFile: cvFile.trim(),
      qualificationCertificates,
      ndtCertificate: ndtCertValue,
      owningDepartment: operationDepartment._id,
      currentStatus: 'OPERATION_STAGE_A',
      statusHistory: [{
        status: 'OPERATION_STAGE_A',
        changedBy: req.user.userId,
        changedAt: new Date()
      }],
      createdBy: req.user.userId,
      isActive: true
    });

    const populatedPerson = await Person.findById(person._id)
      .populate('owningDepartment', 'name code')
      .populate('createdBy', 'fullName email')
      .populate('statusHistory.changedBy', 'fullName email');

    // Audit log successful creation
    await logPersonAction(
      'PERSON_CREATE',
      req.user.userId,
      person._id,
      {
        fullName: person.fullName,
        email: person.email,
        category: person.category,
        employmentType: person.employmentType
      },
      {
        hasCV: !!person.cvFile,
        qualificationCertCount: person.qualificationCertificates.length,
        hasNDT: !!person.ndtCertificate
      },
      req
    );

    logger.info(`Person created: ${person.email} (${person._id}) by user ${req.user.userId}`);

    res.status(201).json({
      success: true,
      data: { person: populatedPerson },
      message: 'Person created successfully in Stage-A'
    });
  } catch (error) {
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const fieldName = field === 'email' ? 'email' : 'primary mobile';
      
      await logPersonAction(
        'PERSON_DUPLICATE_ATTEMPT',
        req.user.userId,
        null,
        { attemptedField: field },
        { reason: `${fieldName} already exists` },
        req
      );

      return res.status(400).json({
        success: false,
        error: `Person with this ${fieldName} already exists`
      });
    }

    logger.error('Create person error:', error);
    next(error);
  }
};

/**
 * Get person by ID
 * GET /api/persons/:id
 */
const getPerson = async (req, res, next) => {
  try {
    const person = await Person.findById(req.params.id)
      .populate('owningDepartment', 'name code')
      .populate('createdBy', 'fullName email')
      .populate('statusHistory.changedBy', 'fullName email');

    if (!person) {
      return res.status(404).json({
        success: false,
        error: 'Person not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { person }
    });
  } catch (error) {
    logger.error('Get person error:', error);
    next(error);
  }
};

/**
 * List persons
 * GET /api/persons
 */
const listPersons = async (req, res, next) => {
  try {
    const { status, category, owningDepartment, limit = 100, skip = 0 } = req.query;

    // Build query
    const query = {};

    if (status) {
      query.currentStatus = status;
    }

    if (category) {
      query.category = category;
    }

    if (owningDepartment) {
      query.owningDepartment = owningDepartment;
    }

    // Parse pagination
    const limitNum = Math.min(parseInt(limit, 10) || 100, 1000); // Max 1000
    const skipNum = Math.max(parseInt(skip, 10) || 0, 0);

    // Fetch persons
    const persons = await Person.find(query)
      .populate('owningDepartment', 'name code')
      .populate('createdBy', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(skipNum);

    // Get total count
    const total = await Person.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        persons,
        pagination: {
          total,
          limit: limitNum,
          skip: skipNum,
          hasMore: (skipNum + limitNum) < total
        }
      }
    });
  } catch (error) {
    logger.error('List persons error:', error);
    next(error);
  }
};

/**
 * Submit person to Finance (Workflow Transition)
 * POST /api/persons/:id/submit-to-finance
 */
const submitPersonToFinance = async (req, res, next) => {
  try {
    const personId = req.params.id;

    // Validate person exists
    const person = await Person.findById(personId)
      .populate('owningDepartment', 'name code');
    
    if (!person) {
      return res.status(404).json({
        success: false,
        error: 'Person not found'
      });
    }

    // Validate person status
    if (person.currentStatus !== 'OPERATION_STAGE_A') {
      return res.status(400).json({
        success: false,
        error: `Cannot submit person. Current status is ${person.currentStatus}. Only persons with status OPERATION_STAGE_A can be submitted to Finance.`
      });
    }

    // Check if already submitted (idempotent check)
    if (person.currentStatus === 'FINANCE_STAGE') {
      return res.status(409).json({
        success: false,
        error: 'Person has already been submitted to Finance'
      });
    }

    // Validate user is from Operation department
    const userDepartment = await Department.findById(req.user.departmentId);
    if (!userDepartment) {
      return res.status(500).json({
        success: false,
        error: 'User department not found'
      });
    }

    // Find Operation department
    const operationDepartment = await Department.findOne({
      $or: [
        { code: 'OPERATION' },
        { name: { $regex: /^operation$/i } }
      ]
    });

    if (!operationDepartment) {
      return res.status(500).json({
        success: false,
        error: 'Operation department not found. Please contact administrator.'
      });
    }

    // Check if user's department is Operation
    if (userDepartment._id.toString() !== operationDepartment._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Only users from Operation department can submit persons to Finance'
      });
    }

    // Find Finance department
    const financeDepartment = await Department.findOne({
      $or: [
        { code: 'FINANCE' },
        { name: { $regex: /^finance$/i } }
      ]
    });

    if (!financeDepartment) {
      return res.status(500).json({
        success: false,
        error: 'Finance department not found. Please contact administrator.'
      });
    }

    // Store previous values for audit
    const previousStatus = person.currentStatus;
    const previousDepartmentId = person.owningDepartment._id.toString();
    const fromDepartment = person.owningDepartment.name;
    const toDepartment = financeDepartment.name;

    // Update person status and ownership
    person.currentStatus = 'FINANCE_STAGE';
    person.owningDepartment = financeDepartment._id;

    // Append to status history
    person.statusHistory.push({
      status: 'FINANCE_STAGE',
      changedBy: req.user.userId,
      changedAt: new Date()
    });

    await person.save();

    // Populate updated person
    const updatedPerson = await Person.findById(person._id)
      .populate('owningDepartment', 'name code')
      .populate('createdBy', 'fullName email')
      .populate('statusHistory.changedBy', 'fullName email');

    // Audit log
    await logPersonAction(
      'PERSON_SUBMITTED_TO_FINANCE',
      req.user.userId,
      person._id,
      {
        previousStatus,
        newStatus: 'FINANCE_STAGE',
        fromDepartment,
        toDepartment,
        previousDepartmentId,
        newDepartmentId: financeDepartment._id.toString()
      },
      {
        submittedBy: req.user.userId,
        submittedAt: new Date().toISOString()
      },
      req
    );

    logger.info(`Person ${person.email} (${person._id}) submitted to Finance by user ${req.user.userId}`);

    res.status(200).json({
      success: true,
      data: { person: updatedPerson },
      message: 'Person successfully submitted to Finance'
    });
  } catch (error) {
    logger.error('Submit person to Finance error:', error);
    next(error);
  }
};

module.exports = {
  createPerson,
  getPerson,
  listPersons,
  submitPersonToFinance
};


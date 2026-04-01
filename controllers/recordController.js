import { encryptData, decryptData } from "../utils/encryption.js";
import prisma from "../models/db.js";
import { createRecordSchema } from "../validations/schemas.js";

export const createRecord = async (req, res, next) => {
  try {
    // We lean on Zod to catch negative amounts or future dates before we do any heavy lifting
    const { amount, type, category, date, notesEncrypted } = createRecordSchema.parse(req.body);

    // Securely encrypt the vulnerable float data using AES-256-GCM
    const encryptedResult = encryptData(amount.toString());
    
    const record = await prisma.record.create({
      data: { 
        userId: req.user.id, 
        amountEncrypted: encryptedResult.encrypted, 
        iv: encryptedResult.iv, 
        authTag: encryptedResult.authTag, 
        type, 
        category, 
        date: new Date(date), 
        notesEncrypted 
      }
    });

    res.status(201).json({ 
      message: "Securely stored your record.", 
      recordId: record.id 
    });

  } catch (err) { 
    console.error("Trouble creating record:", err);
    next(err); 
  }
};

export const getRecords = async (req, res, next) => {
  try {
    // Grab pagination values and ensure they stay within reasonable bounds to prevent memory blowouts (max 1000)
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit) || 100));

    // Pull our filter options right from the query parameters
    const { type, category, startDate, endDate } = req.query;
    
    // Set up our flexible 'where' clause for Prisma
    const filterQuery = {};
    
    // Apply exact string matches if the user asked for them
    if (type) filterQuery.type = type;
    if (category) filterQuery.category = category;
    
    // Safely parse date boundaries so Prisma doesn't crash on garbage text
    if (startDate || endDate) {
      filterQuery.date = {};
      if (startDate && !isNaN(new Date(startDate).getTime())) {
        filterQuery.date.gte = new Date(startDate);
      }
      if (endDate && !isNaN(new Date(endDate).getTime())) {
        filterQuery.date.lte = new Date(endDate);
      }
    }
    
    // Fetch only what we need from the database
    const records = await prisma.record.findMany({ 
      where: filterQuery,
      skip: (page - 1) * limit, 
      take: limit, 
      orderBy: { date: "desc" } 
    });
    
    // Loop through the ciphertexts and decipher them back into human-readable floats
    const securedRecords = records.map(r => ({ 
      id: r.id, 
      amount: parseFloat(decryptData(r.amountEncrypted, r.iv, r.authTag)), 
      type: r.type, 
      category: r.category, 
      date: r.date, 
      notes: r.notesEncrypted, 
      userId: r.userId 
    }));
    
    res.json({ 
      data: securedRecords, 
      count: securedRecords.length, 
      page, 
      limit 
    });

  } catch (err) { 
    console.error("Retrieval issue:", err);
    next(err); 
  }
};

export const getSummary = async (req, res, next) => {
  try {
    // For a summary, we need to crunch everything. In a larger app, we might cache this in Redis.
    const records = await prisma.record.findMany();
    
    let totalIncome = 0;
    let totalExpenses = 0; 
    let categoryAnalysis = {};
    
    // Walk through and compile the analytics
    for (const r of records) {
      // Decrypt the value on the fly
      const decryptedAmount = parseFloat(decryptData(r.amountEncrypted, r.iv, r.authTag)) || 0;
      
      if (r.type === "INCOME") {
        totalIncome += decryptedAmount;
      } else if (r.type === "EXPENSE") {
        totalExpenses += decryptedAmount;
      }

      // Tally up the category buckets, initializing to 0 if it's new
      categoryAnalysis[r.category] = (categoryAnalysis[r.category] || 0) + decryptedAmount;
    }
    
    res.json({ 
      totalIncome, 
      totalExpenses, 
      netBalance: totalIncome - totalExpenses, 
      categoryAnalysis 
    });

  } catch (err) { 
    console.error("Summary crunching failed:", err);
    next(err); 
  }
};

export const deleteRecord = async (req, res, next) => {
  // Simply yank the record entirely out of the database based on the ID param
  try { 
    await prisma.record.delete({ 
      where: { id: req.params.id } 
    }); 
    
    res.json({ message: "Record deleted completely from system." }); 

  } catch(err) { 
    next(err); 
  }
};
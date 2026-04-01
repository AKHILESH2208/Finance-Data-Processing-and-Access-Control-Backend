import { encryptData, decryptData } from "../utils/encryption.js";
import prisma from "../models/db.js";

export const createRecord = async (req, res, next) => {
  try {
    const { amount, type, category, date, notesEncrypted } = req.body;
    
    // quick sanity check
    if (!amount || !type || !category || !date) {
      return res.status(400).json({ error: "Missing some required fields over here!" });
    }

    // securely encrypting the vulnerable float data
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
    // pagination defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    
    // fetching the raw ciphertexts
    const records = await prisma.record.findMany({ 
      skip: (page - 1) * limit, 
      take: limit, 
      orderBy: { date: "desc" } 
    });
    
    // mapping out and dynamically reconstructing the plaintext
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
    const records = await prisma.record.findMany();
    
    let totalIncome = 0;
    let totalExpenses = 0; 
    let categoryAnalysis = {};
    
    // crunch the numbers
    for (const r of records) {
      // decipher it on the fly
      const decryptedAmount = parseFloat(decryptData(r.amountEncrypted, r.iv, r.authTag)) || 0;
      
      if (r.type === "INCOME") {
        totalIncome += decryptedAmount;
      } else if (r.type === "EXPENSE") {
        totalExpenses += decryptedAmount;
      }

      // tally up the category bins
      if (categoryAnalysis[r.category]) {
         categoryAnalysis[r.category] += decryptedAmount;
      } else {
         categoryAnalysis[r.category] = decryptedAmount;
      }
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
  try { 
    // simply yank it out of the db
    await prisma.record.delete({ 
      where: { id: req.params.id } 
    }); 
    
    res.json({ message: "Record deleted completely from system." }); 

  } catch(err) { 
    next(err); 
  }
};
# 🎬 Demo Quick Reference Card

## ⚡ Pre-Demo Checklist (2 min)

```bash
# 1. Start server
npm run dev

# 2. Verify connection
curl http://localhost:3000/api/health

# 3. Check Supabase is unpaused
# Visit: https://supabase.com/dashboard
```

---

## 🎯 5-Minute Demo Script

### 1. **Opening** (30 sec)
> "I'll demonstrate a blockchain-based government budget transparency system that ensures every spending decision is verifiable and immutable."

### 2. **Create Budget Allocation** (1.5 min)
- Go to: `/admin/budget`
- Click: "Create Allocation"
- Fill:
  - Ministry: Education
  - Category: CAPEX
  - Project: "New Primary School"
  - Amount: 50,000,000
- **Say**: "This is now on the blockchain - immutable record"

### 3. **Create Disbursement** (1 min)
- Go to: `/admin/disbursements`
- Select the allocation
- Amount: 10,000,000
- **Say**: "Payment recorded on blockchain - citizens can verify"

### 4. **Public Verification** (1.5 min)
- Go to: `/verify`
- Enter project code
- **Show**: 
  - ✅ Transaction verified
  - Blockchain hash
  - Click Polygonscan link
- **Say**: "Anyone can verify - no login needed - true transparency"

### 5. **Closing** (30 sec)
> "This demonstrates how blockchain brings transparency to government spending - every transaction is verifiable, immutable, and accessible to all citizens."

---

## 🔗 Quick Links

| Page | URL |
|------|-----|
| Home | `http://localhost:3000` |
| Admin | `http://localhost:3000/admin` |
| Budget | `http://localhost:3000/admin/budget` |
| Ministries | `http://localhost:3000/admin/ministries` |
| Contractors | `http://localhost:3000/admin/contractors` |
| Disbursements | `http://localhost:3000/admin/disbursements` |
| Contractor Portal | `http://localhost:3000/contractor` |
| **Verify** | `http://localhost:3000/verify` ⭐ |
| Health Check | `http://localhost:3000/api/health` |

---

## 💬 Key Talking Points

### Blockchain
- ✅ "Every transaction recorded on Polygon blockchain"
- ✅ "Immutable - cannot be altered or deleted"
- ✅ "Public verification - no special access needed"

### Transparency
- ✅ "Citizens can verify any government spending"
- ✅ "Complete audit trail of all actions"
- ✅ "Real-time updates and notifications"

### Security
- ✅ "Digital signatures for officials"
- ✅ "Role-based access control"
- ✅ "Complete audit logging"

---

## 🚨 Troubleshooting

| Problem | Solution |
|---------|----------|
| 500 Error | Check Supabase is unpaused |
| Page won't load | Restart dev server |
| No data | Run `scripts/setup-demo-data.sql` |
| Blockchain fails | System continues - show database record |

---

## 📝 Demo Data Values

**Ministries:**
- Ministry of Education (EDU)
- Ministry of Health (HEALTH)
- Ministry of Infrastructure (INFRA)

**Contractors:**
- ABC Construction Ltd (RC-12345)
- XYZ Infrastructure Group (RC-67890)

**Categories:**
- Capital Expenditure (CAPEX)
- Operating Expenditure (OPEX)

---

## 🎤 Sample Project Codes

If you create allocations, note the project codes:
- Example: `PROJ-2024-001`
- Use these for verification demo

---

**Keep this open during your demo! 📱**


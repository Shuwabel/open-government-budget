# 🚀 Quick Demo Guide - Cheat Sheet

## ⚡ Quick Start (30 seconds)

```bash
cd '/Users/goddaffi/Final Year Projects/blockchain-validation'
npm run dev
# Wait for: "✓ Ready in 500ms"
# Open: http://localhost:3000
```

---

## 🎯 5-Minute Demo Flow

### 1. Home Page (30 sec)
- Open `http://localhost:3000`
- Show: "Transparent Government Spending"
- Point out: 3 portals (Government, Contractor, Verify)

### 2. Government Portal (1 min)
- Click "Government Portal"
- Show: Dashboard with metrics
- Navigate: Budget Allocations, Disbursements

### 3. Contractor Portal (1 min)
- Click "Contractor Portal"
- Show: Dashboard with stats
- Show: Expenditure Reports tab

### 4. Public Verification (1 min)
- Click "Verify Spending"
- Enter: Any project code (e.g., "TEST-001")
- Show: Verification interface
- Explain: Blockchain verification

### 5. API Demo (1 min)
- Open Browser DevTools (F12)
- Navigate to Network tab
- Refresh any page
- Show: API calls working

### 6. Blockchain (30 sec)
- Open: https://polygonscan.com/address/0x33b1Ff27Ba5bD2Ed1461a71AF27bC58E4be56E74
- Show: Live contract on Polygon mainnet

---

## 🔍 Quick API Tests

```bash
# Test 1: Connection
curl http://localhost:3000/api/test

# Test 2: Budget Allocations
curl http://localhost:3000/api/budget-allocations

# Test 3: Verification
curl -X POST http://localhost:3000/api/public/verify \
  -H "Content-Type: application/json" \
  -d '{"projectCode": "TEST"}'
```

---

## 📝 Key Points to Mention

✅ **All APIs Working** - Every endpoint responds correctly
✅ **Live Blockchain** - Contracts on Polygon mainnet (not testnet!)
✅ **Production Ready** - Complete system with security
✅ **Real Impact** - Solves actual transparency problems
✅ **Modern Stack** - Latest technologies

---

## 🛡️ Handling Questions

**"Why is database empty?"**
→ Fresh deployment. System ready, data populated through admin interface.

**"Does blockchain actually work?"**
→ Yes! Live contracts on Polygon mainnet. Show Polygonscan.

**"Can citizens verify?"**
→ Yes! Search by project code or transaction hash. Results verified on blockchain.

**"Is it secure?"**
→ Multiple layers: RLS, RBAC, input validation, audit logs, blockchain immutability.

---

## 🎬 Presentation Script (Quick)

**Opening:** "Blockchain-based government budget transparency system"

**Problem:** "Lack of transparency, corruption potential, limited public access"

**Solution:** "Immutable blockchain records, public verification, complete audit trail"

**Demo:** Show all 4 pages, APIs, blockchain contracts

**Impact:** "Transparency, accountability, reduced corruption"

---

## 🔗 Important Links

- **Application:** http://localhost:3000
- **Budget Contract:** https://polygonscan.com/address/0x33b1Ff27Ba5bD2Ed1461a71AF27bC58E4be56E74
- **Certificate Contract:** https://polygonscan.com/address/0x9F63a500e67B315E57e504c879837619BAD0DA76

---

## ⚠️ If Something Breaks

**Server won't start?**
```bash
# Kill port 3000
lsof -ti:3000 | xargs kill -9
# Restart
npm run dev
```

**API not responding?**
- Check server is running
- Check .env.local has Supabase credentials
- Try: `curl http://localhost:3000/api/test`

**Page not loading?**
- Check browser console (F12)
- Verify server is running
- Try hard refresh (Cmd+Shift+R)

---

**You've got this! The system works! 💪**


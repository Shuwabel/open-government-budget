# Government Budget Transparency System

A comprehensive blockchain-based platform for tracking government budget allocations and expenditures with full transparency and accountability.

## 🚀 Features

### Core Functionality
- **Budget Allocation Tracking**: Monitor government budget allocations across ministries
- **Disbursement Management**: Track fund disbursements to contractors and departments
- **Expenditure Reporting**: Contractors can submit detailed expenditure reports
- **Public Verification**: Citizens can verify any government transaction on blockchain
- **Blockchain Integration**: All transactions are recorded on Polygon blockchain
- **Role-Based Access**: Different access levels for officials, contractors, and public users

### Blockchain Features
- **Smart Contracts**: Solidity contracts for budget tracking and certificate issuance
- **Web3 Integration**: MetaMask wallet connection and transaction signing
- **Real-time Verification**: Live blockchain transaction verification
- **Digital Certificates**: NFT certificates for verified transactions
- **Digital Signatures**: Cryptographic signature verification for officials

### User Interfaces
- **Government Portal**: Admin dashboard for budget management
- **Contractor Portal**: Dashboard for expenditure reporting
- **Public Portal**: Verification interface for citizens
- **Mobile Responsive**: Works on all device sizes

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Blockchain**: Polygon Network, Solidity Smart Contracts, Ethers.js
- **UI Components**: shadcn/ui, Lucide React icons
- **Authentication**: Supabase Auth with role-based access control
- **File Storage**: Supabase Storage with IPFS integration
- **Deployment**: Vercel, Hardhat for smart contracts

## 📋 Prerequisites

- Node.js 18+ 
- npm or pnpm
- Supabase account
- MetaMask wallet (for blockchain integration)
- Polygon wallet (for mainnet deployment)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd blockchain-validation
npm install
```

### 2. Environment Setup

Copy the example environment file and add your credentials:

```bash
cp env.example .env.local
```

Update `.env.local` with your project details:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://esqpdszhupkzgrbxsmby.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Blockchain Configuration
NEXT_PUBLIC_POLYGON_RPC_URL=https://polygon-rpc.com
NEXT_PUBLIC_MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
NEXT_PUBLIC_BUDGET_CONTRACT_ADDRESS=your_contract_address
NEXT_PUBLIC_CERTIFICATE_CONTRACT_ADDRESS=your_certificate_address
NEXT_PUBLIC_CHAIN_ID=137
NEXT_PUBLIC_POLYGONSCAN_API_KEY=your_polygonscan_key
```

### 3. Database Setup

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the migration script from `supabase/migrations/001_initial_schema.sql`
4. This will create all necessary tables and sample data

### 4. Smart Contract Deployment (Optional)

```bash
cd contracts
npm install
npx hardhat compile
npx hardhat run scripts/deploy.js --network mumbai
```

### 5. Run the Application

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 🗄️ Database Schema

The system uses the following main tables:

- **ministries**: Government ministries and departments
- **budget_allocations**: Budget allocations for projects
- **contractors**: Contractors and vendors
- **disbursements**: Fund disbursements to contractors
- **expenditure_reports**: Detailed expenditure reports
- **expenditure_items**: Individual expenditure line items
- **government_officials**: Government officials with roles
- **public_users**: Public users (citizens, journalists, etc.)
- **documents**: File storage and document management
- **audit_logs**: Complete audit trail of all actions
- **verification_requests**: Public verification requests

## 👥 User Roles

### Government Officials
- **Super Admin**: Full system access, contract deployment
- **Ministry Admin**: Ministry-level budget management
- **Finance Officer**: Disbursement processing
- **Auditor**: Verification and compliance

### Contractors
- Submit expenditure reports
- Upload supporting documents
- View their disbursements
- Track verification status

### Public Users
- Verify government transactions
- Search public budget data
- Download reports
- Request verification

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/login-official` - Government official login
- `POST /api/auth/login-contractor` - Contractor login
- `POST /api/auth/register-public` - Public user registration

### Budget Management
- `GET /api/budget-allocations` - List budget allocations
- `POST /api/budget-allocations` - Create budget allocation
- `PUT /api/budget-allocations` - Update budget allocation
- `DELETE /api/budget-allocations` - Cancel budget allocation

### Disbursements
- `GET /api/disbursements` - List disbursements
- `POST /api/disbursements` - Create disbursement
- `PUT /api/disbursements` - Update disbursement

### Expenditure Reports
- `GET /api/expenditure-reports` - List expenditure reports
- `POST /api/expenditure-reports` - Submit expenditure report
- `PUT /api/expenditure-reports` - Update expenditure report

### Public Verification
- `GET /api/public/allocations` - Public view of allocations
- `POST /api/public/verify` - Request verification
- `GET /api/public/search` - Search public data

## 🔐 Security Features

- Row Level Security (RLS) policies in Supabase
- Role-based access control with granular permissions
- Input validation and sanitization
- Audit logging for all actions
- Blockchain verification for transactions
- Digital signature verification
- Rate limiting and security headers

## 🧪 Testing

Test the Supabase connection:

```bash
curl http://localhost:3000/api/test
```

Test blockchain verification:

```bash
curl -X POST http://localhost:3000/api/public/verify \
  -H "Content-Type: application/json" \
  -d '{"projectCode": "PROJ-2024-001"}'
```

## 📱 Usage

### For Government Officials
1. Login to the admin portal (`/admin`)
2. Create budget allocations for ministries
3. Approve disbursements to contractors
4. Monitor expenditure reports
5. Verify contractor submissions

### For Contractors
1. Access contractor portal (`/contractor`)
2. Connect MetaMask wallet
3. View disbursements and project details
4. Submit expenditure reports with supporting documents
5. Track verification status

### For Public Users
1. Visit the verification portal (`/verify`)
2. Search for transactions by project code or transaction hash
3. View blockchain-verified transaction details
4. Download verification reports
5. Access public budget data

## 🚀 Deployment

### Frontend Deployment (Vercel)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Smart Contract Deployment
1. Deploy to Mumbai testnet first:
   ```bash
   npx hardhat run scripts/deploy.js --network mumbai
   ```
2. Deploy to Polygon mainnet:
   ```bash
   npx hardhat run scripts/deploy.js --network polygon
   ```
3. Verify contracts on Polygonscan

### Supabase Setup
1. Create a new Supabase project
2. Run the migration script
3. Configure authentication providers
4. Set up file storage buckets
5. Configure Row Level Security policies

## 🔧 Development

### Adding New Features
1. Create database migrations in `supabase/migrations/`
2. Update TypeScript types in `lib/supabase.ts`
3. Add API routes in `app/api/`
4. Create UI components in `components/`
5. Update smart contracts in `contracts/`

### Database Changes
1. Modify the schema in Supabase dashboard
2. Update the migration script
3. Regenerate TypeScript types
4. Update API endpoints

### Smart Contract Development
1. Modify contracts in `contracts/`
2. Update tests in `contracts/test/`
3. Deploy to testnet first
4. Test thoroughly before mainnet deployment

## 📊 Monitoring

- Application monitoring with Sentry
- Database performance monitoring
- Blockchain transaction monitoring
- User activity analytics
- Error tracking and logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in `/docs`
- Contact the development team

## 🔮 Future Enhancements

- Mobile app for contractors
- AI-powered anomaly detection
- Integration with government payment systems
- Multi-language support
- Advanced analytics dashboard
- Real-time notifications
- Multi-signature wallet support
- Cross-chain compatibility
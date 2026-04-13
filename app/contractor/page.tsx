"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  FileText, 
  Upload, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Building2,
  Calendar,
  Download,
  Eye,
  Plus,
  Home,
  Shield,
  LogOut,
  FileUp
} from 'lucide-react';
import { FileUpload } from '@/components/storage/file-upload';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Disbursement {
  id: string;
  projectName: string;
  ministry: string;
  amount: number;
  status: 'pending' | 'approved' | 'disbursed' | 'completed';
  disbursementDate: string;
  expectedCompletionDate: string;
  blockchainTxHash?: string;
}

interface ExpenditureReport {
  id: string;
  disbursementId: string;
  projectName: string;
  totalAmount: number;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  submittedAt?: string;
  reviewedAt?: string;
  items: ExpenditureItem[];
}

interface ExpenditureItem {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  receiptUrl?: string;
}

function ContractorDashboard({ contractorId }: { contractorId: string }) {
  const [disbursements, setDisbursements] = useState<Disbursement[]>([]);
  const [expenditureReports, setExpenditureReports] = useState<ExpenditureReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadContractorData();
  }, [contractorId]);

  const loadContractorData = async () => {
    try {
      const disbursementsResponse = await fetch(`/api/disbursements?contractorId=${contractorId}`);
      const disbursementsData = await disbursementsResponse.json();
      setDisbursements(disbursementsData.data || []);

      const reportsResponse = await fetch(`/api/expenditure-reports?contractorId=${contractorId}`);
      const reportsData = await reportsResponse.json();
      setExpenditureReports(reportsData.data || []);
    } catch (error) {
      console.error('Error loading contractor data:', error);
      toast.error('Failed to load contractor data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'approved':
      case 'completed':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'disbursed':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'draft':
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
      case 'submitted':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'under_review':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'rejected':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
      case 'under_review':
        return <Clock className="w-4 h-4" />;
      case 'approved':
      case 'completed':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'disbursed':
      case 'submitted':
        return <TrendingUp className="w-4 h-4" />;
      case 'rejected':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const stats = {
    totalDisbursements: disbursements.length,
    totalAmount: disbursements.reduce((sum, d) => sum + d.amount, 0),
    pendingReports: expenditureReports.filter(r => r.status === 'draft').length,
    submittedReports: expenditureReports.filter(r => r.status === 'submitted' || r.status === 'under_review').length
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const navItems = [
    { href: '/contractor', label: 'Dashboard', icon: Home, value: 'overview' },
    { href: '#', label: 'Disbursements', icon: DollarSign, value: 'disbursements' },
    { href: '#', label: 'Reports', icon: FileText, value: 'reports' },
    { href: '#', label: 'Documents', icon: FileUp, value: 'documents' },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border h-screen sticky top-0 flex flex-col">
        <div className="p-6 border-b border-sidebar-border">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sidebar-primary to-accent flex items-center justify-center">
              <Shield className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-sidebar-foreground">Contractor Portal</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.value;
            return (
              <button
                key={item.value}
                onClick={() => setActiveTab(item.value)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/20",
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <Link href="/">
            <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/20">
              <LogOut className="w-5 h-5 mr-2" />
              <span className="font-medium">Back to Home</span>
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Contractor Dashboard</h1>
            <p className="text-muted-foreground">Manage your disbursements and expenditure reports</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-primary/20 gradient-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Disbursements</CardTitle>
                <DollarSign className="w-5 h-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stats.totalDisbursements}</div>
                <p className="text-xs text-muted-foreground mt-1">Active projects</p>
              </CardContent>
            </Card>

            <Card className="border-primary/20 gradient-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Amount</CardTitle>
                <TrendingUp className="w-5 h-5 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalAmount)}</div>
                <p className="text-xs text-muted-foreground mt-1">Disbursed funds</p>
              </CardContent>
            </Card>

            <Card className="border-primary/20 gradient-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Reports</CardTitle>
                <FileText className="w-5 h-5 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stats.pendingReports}</div>
                <p className="text-xs text-muted-foreground mt-1">Draft reports</p>
              </CardContent>
            </Card>

            <Card className="border-primary/20 gradient-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Under Review</CardTitle>
                <Clock className="w-5 h-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stats.submittedReports}</div>
                <p className="text-xs text-muted-foreground mt-1">Submitted reports</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsContent value="overview" className="space-y-6">
              {/* Recent Disbursements */}
              <Card className="border-primary/20 gradient-card">
                <CardHeader>
                  <CardTitle>Recent Disbursements</CardTitle>
                </CardHeader>
                <CardContent>
                  {disbursements.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No disbursements found
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {disbursements.slice(0, 5).map((disbursement) => (
                        <div
                          key={disbursement.id}
                          className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary/30 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-foreground">{disbursement.projectName}</h4>
                              <p className="text-sm text-muted-foreground">{disbursement.ministry}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-foreground">{formatCurrency(disbursement.amount)}</p>
                            <Badge className={getStatusColor(disbursement.status)}>
                              {getStatusIcon(disbursement.status)}
                              <span className="ml-1 capitalize">{disbursement.status}</span>
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Reports */}
              <Card className="border-primary/20 gradient-card">
                <CardHeader>
                  <CardTitle>Recent Expenditure Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  {expenditureReports.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No expenditure reports found
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {expenditureReports.slice(0, 5).map((report) => (
                        <div
                          key={report.id}
                          className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary/30 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                              <FileText className="w-5 h-5 text-accent" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-foreground">{report.projectName}</h4>
                              <p className="text-sm text-muted-foreground">
                                {report.submittedAt ? `Submitted ${formatDate(report.submittedAt)}` : 'Draft'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-foreground">{formatCurrency(report.totalAmount)}</p>
                            <Badge className={getStatusColor(report.status)}>
                              {getStatusIcon(report.status)}
                              <span className="ml-1 capitalize">{report.status.replace('_', ' ')}</span>
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="disbursements" className="space-y-6">
              <Card className="border-primary/20 gradient-card">
                <CardHeader>
                  <CardTitle>All Disbursements</CardTitle>
                </CardHeader>
                <CardContent>
                  {disbursements.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No disbursements found
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {disbursements.map((disbursement) => (
                        <div
                          key={disbursement.id}
                          className="p-6 border border-border rounded-lg hover:border-primary/30 transition-colors gradient-card"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-foreground mb-2">
                                {disbursement.projectName}
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Building2 className="w-4 h-4" />
                                  {disbursement.ministry}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  Disbursed: {formatDate(disbursement.disbursementDate)}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-foreground mb-2">
                                {formatCurrency(disbursement.amount)}
                              </p>
                              <Badge className={getStatusColor(disbursement.status)}>
                                {getStatusIcon(disbursement.status)}
                                <span className="ml-1 capitalize">{disbursement.status}</span>
                              </Badge>
                            </div>
                          </div>
                          
                          {disbursement.blockchainTxHash && (
                            <div className="mt-4 p-3 bg-muted rounded-lg">
                              <p className="text-sm text-muted-foreground mb-1">Blockchain Transaction:</p>
                              <code className="text-sm font-mono text-foreground break-all">
                                {disbursement.blockchainTxHash}
                              </code>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-foreground">Expenditure Reports</h2>
                <Button className="bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/20">
                  <Plus className="w-4 h-4 mr-2" />
                  New Report
                </Button>
              </div>

              <Card className="border-primary/20 gradient-card">
                <CardContent className="p-6">
                  {expenditureReports.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No expenditure reports found. Create your first report to get started.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {expenditureReports.map((report) => (
                        <div
                          key={report.id}
                          className="p-6 border border-border rounded-lg hover:border-primary/30 transition-colors gradient-card"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-foreground mb-2">
                                {report.projectName}
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>Report ID: {report.id.substring(0, 8)}...</span>
                                {report.submittedAt && (
                                  <span>Submitted: {formatDate(report.submittedAt)}</span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-foreground mb-2">
                                {formatCurrency(report.totalAmount)}
                              </p>
                              <Badge className={getStatusColor(report.status)}>
                                {getStatusIcon(report.status)}
                                <span className="ml-1 capitalize">{report.status.replace('_', ' ')}</span>
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="space-y-6">
              <Card className="border-primary/20 gradient-card">
                <CardHeader>
                  <CardTitle>Document Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <FileUpload
                    bucket="contractor-documents"
                    path={`contractor-${contractorId}`}
                    uploadedBy={contractorId}
                    onUploadComplete={(results) => {
                      const successCount = results.filter(r => r.success).length;
                      if (successCount > 0) {
                        toast.success(`${successCount} document(s) uploaded successfully`);
                      }
                    }}
                    enableIPFS={true}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

export default function ContractorPage() {
  return <ContractorDashboard contractorId="default-contractor-id" />;
}

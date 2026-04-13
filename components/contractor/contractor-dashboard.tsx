"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  DollarSign, 
  FileText, 
  Upload, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Plus,
  Eye,
  Download
} from 'lucide-react';
import { toast } from 'sonner';

interface Disbursement {
  id: string;
  amount: number;
  purpose: string;
  status: string;
  approved_at: string;
  blockchain_tx_hash?: string;
  budget_allocations: {
    project_name: string;
    project_code: string;
  };
}

interface ExpenditureReport {
  id: string;
  total_amount: number;
  report_hash: string;
  is_verified: boolean;
  created_at: string;
  disbursements: {
    amount: number;
    purpose: string;
  };
}

export function ContractorDashboard() {
  const [disbursements, setDisbursements] = useState<Disbursement[]>([]);
  const [expenditureReports, setExpenditureReports] = useState<ExpenditureReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReportForm, setShowReportForm] = useState(false);
  const [selectedDisbursement, setSelectedDisbursement] = useState<Disbursement | null>(null);
  const [reportForm, setReportForm] = useState({
    totalAmount: '',
    reportHash: '',
    expenditureItems: [{ description: '', amount: '', category: '', receiptUrl: '' }]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch disbursements for this contractor
      const disbursementsResponse = await fetch('/api/disbursements?contractorId=current-contractor');
      const disbursementsData = await disbursementsResponse.json();
      
      if (disbursementsData.success) {
        setDisbursements(disbursementsData.data);
      }

      // Fetch expenditure reports
      const reportsResponse = await fetch('/api/expenditure-reports?contractorId=current-contractor');
      const reportsData = await reportsResponse.json();
      
      if (reportsData.success) {
        setExpenditureReports(reportsData.data);
      }

    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!selectedDisbursement) return;

    try {
      const response = await fetch('/api/expenditure-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          disbursementId: selectedDisbursement.id,
          contractorId: 'current-contractor',
          totalAmount: parseFloat(reportForm.totalAmount),
          reportHash: reportForm.reportHash,
          expenditureItems: reportForm.expenditureItems.filter(item => 
            item.description && item.amount && item.category
          ),
          submittedBy: 'current-contractor'
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Expenditure report submitted successfully');
        setShowReportForm(false);
        setSelectedDisbursement(null);
        setReportForm({
          totalAmount: '',
          reportHash: '',
          expenditureItems: [{ description: '', amount: '', category: '', receiptUrl: '' }]
        });
        fetchData();
      } else {
        toast.error(data.error || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Failed to submit report:', error);
      toast.error('Failed to submit expenditure report');
    }
  };

  const addExpenditureItem = () => {
    setReportForm(prev => ({
      ...prev,
      expenditureItems: [...prev.expenditureItems, { description: '', amount: '', category: '', receiptUrl: '' }]
    }));
  };

  const updateExpenditureItem = (index: number, field: string, value: string) => {
    setReportForm(prev => ({
      ...prev,
      expenditureItems: prev.expenditureItems.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeExpenditureItem = (index: number) => {
    setReportForm(prev => ({
      ...prev,
      expenditureItems: prev.expenditureItems.filter((_, i) => i !== index)
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'disbursed':
        return 'bg-green-500/10 text-green-600';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-600';
      case 'completed':
        return 'bg-blue-500/10 text-blue-600';
      default:
        return 'bg-gray-500/10 text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'disbursed':
        return CheckCircle2;
      case 'pending':
        return Clock;
      case 'completed':
        return CheckCircle2;
      default:
        return AlertCircle;
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalDisbursed = disbursements.reduce((sum, d) => sum + d.amount, 0);
  const totalReported = expenditureReports.reduce((sum, r) => sum + r.total_amount, 0);
  const pendingReports = disbursements.filter(d => d.status === 'disbursed').length - expenditureReports.length;

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Contractor Dashboard</h1>
        <p className="text-muted-foreground">Manage your disbursements and submit expenditure reports</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Disbursed</CardTitle>
            <DollarSign className="w-5 h-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">₦{totalDisbursed.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Reported</CardTitle>
            <FileText className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">₦{totalReported.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Reports</CardTitle>
            <Clock className="w-5 h-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{pendingReports}</div>
          </CardContent>
        </Card>
      </div>

      {/* Disbursements */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Recent Disbursements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {disbursements.map((disbursement) => {
              const StatusIcon = getStatusIcon(disbursement.status);
              return (
                <div
                  key={disbursement.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-foreground">
                        {disbursement.budget_allocations.project_name}
                      </h3>
                      <Badge className={getStatusColor(disbursement.status)}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {disbursement.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Project: {disbursement.budget_allocations.project_code}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Purpose: {disbursement.purpose}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-foreground">
                      ₦{disbursement.amount.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(disbursement.approved_at).toLocaleDateString()}
                    </div>
                    {disbursement.status === 'disbursed' && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedDisbursement(disbursement);
                          setShowReportForm(true);
                        }}
                        className="mt-2 bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/20"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Submit Report
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Expenditure Reports */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Expenditure Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {expenditureReports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-foreground">Report #{report.id.slice(-8)}</h3>
                    <Badge className={report.is_verified ? 'bg-green-500/10 text-green-600' : 'bg-yellow-500/10 text-yellow-600'}>
                      {report.is_verified ? 'Verified' : 'Pending Verification'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Submitted: {new Date(report.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-foreground">
                    ₦{report.total_amount.toLocaleString()}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Report Form Modal */}
      {showReportForm && selectedDisbursement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Submit Expenditure Report</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Project Details</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedDisbursement.budget_allocations.project_name} ({selectedDisbursement.budget_allocations.project_code})
                </p>
                <p className="text-sm text-muted-foreground">
                  Disbursed Amount: ₦{selectedDisbursement.amount.toLocaleString()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Total Amount Spent</label>
                <Input
                  type="number"
                  value={reportForm.totalAmount}
                  onChange={(e) => setReportForm(prev => ({ ...prev, totalAmount: e.target.value }))}
                  placeholder="Enter total amount spent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Report Hash (IPFS)</label>
                <Input
                  value={reportForm.reportHash}
                  onChange={(e) => setReportForm(prev => ({ ...prev, reportHash: e.target.value }))}
                  placeholder="Enter IPFS hash of the expenditure report"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-foreground">Expenditure Items</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addExpenditureItem}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {reportForm.expenditureItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-2 gap-4 p-4 border border-border rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                        <Input
                          value={item.description}
                          onChange={(e) => updateExpenditureItem(index, 'description', e.target.value)}
                          placeholder="Item description"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Amount</label>
                        <Input
                          type="number"
                          value={item.amount}
                          onChange={(e) => updateExpenditureItem(index, 'amount', e.target.value)}
                          placeholder="Amount"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Category</label>
                        <Input
                          value={item.category}
                          onChange={(e) => updateExpenditureItem(index, 'category', e.target.value)}
                          placeholder="Category"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Receipt URL</label>
                        <div className="flex gap-2">
                          <Input
                            value={item.receiptUrl}
                            onChange={(e) => updateExpenditureItem(index, 'receiptUrl', e.target.value)}
                            placeholder="Receipt URL"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeExpenditureItem(index)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowReportForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitReport}
                  className="flex-1 bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/20"
                >
                  Submit Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}


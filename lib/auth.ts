import { supabase, supabaseAdmin } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

// Role-based access control configuration
export const ROLES = {
  SUPER_ADMIN: {
    level: 1,
    permissions: [
      'manage_system',
      'manage_ministries',
      'manage_officials',
      'view_all_data',
      'approve_budgets',
      'audit_system'
    ],
    description: 'System administrator with full access'
  },
  
  MINISTRY_ADMIN: {
    level: 2,
    permissions: [
      'manage_ministry_budget',
      'create_allocations',
      'approve_disbursements',
      'view_ministry_data',
      'manage_contractors'
    ],
    description: 'Ministry-level administrator'
  },
  
  FINANCE_OFFICER: {
    level: 3,
    permissions: [
      'process_disbursements',
      'verify_expenditures',
      'view_financial_data',
      'generate_reports'
    ],
    description: 'Government finance officer'
  },
  
  AUDITOR: {
    level: 4,
    permissions: [
      'view_all_data',
      'request_verifications',
      'generate_audit_reports',
      'flag_anomalies'
    ],
    description: 'Internal/external auditor'
  },
  
  CONTRACTOR: {
    level: 5,
    permissions: [
      'submit_expenditure_reports',
      'upload_documents',
      'view_own_disbursements',
      'acknowledge_receipts'
    ],
    description: 'Contractor/vendor'
  },
  
  PUBLIC_USER: {
    level: 6,
    permissions: [
      'view_public_data',
      'request_verifications',
      'search_transactions',
      'download_reports'
    ],
    description: 'Citizen/public user'
  }
} as const;

// Permission matrix for different operations
export const PERMISSION_MATRIX = {
  // Budget Management
  CREATE_BUDGET_ALLOCATION: ['SUPER_ADMIN', 'MINISTRY_ADMIN'],
  APPROVE_BUDGET_ALLOCATION: ['SUPER_ADMIN', 'MINISTRY_ADMIN'],
  MODIFY_BUDGET_ALLOCATION: ['SUPER_ADMIN', 'MINISTRY_ADMIN'],
  
  // Disbursement Management
  CREATE_DISBURSEMENT: ['SUPER_ADMIN', 'MINISTRY_ADMIN', 'FINANCE_OFFICER'],
  APPROVE_DISBURSEMENT: ['SUPER_ADMIN', 'MINISTRY_ADMIN'],
  PROCESS_DISBURSEMENT: ['SUPER_ADMIN', 'FINANCE_OFFICER'],
  
  // Expenditure Management
  SUBMIT_EXPENDITURE_REPORT: ['CONTRACTOR'],
  VERIFY_EXPENDITURE_REPORT: ['SUPER_ADMIN', 'MINISTRY_ADMIN', 'FINANCE_OFFICER', 'AUDITOR'],
  
  // Verification
  REQUEST_VERIFICATION: ['PUBLIC_USER', 'AUDITOR'],
  VIEW_VERIFICATION_RESULTS: ['PUBLIC_USER', 'AUDITOR', 'SUPER_ADMIN'],
  
  // Data Access
  VIEW_ALL_BUDGET_DATA: ['SUPER_ADMIN', 'AUDITOR'],
  VIEW_MINISTRY_DATA: ['MINISTRY_ADMIN', 'FINANCE_OFFICER'],
  VIEW_PUBLIC_DATA: ['PUBLIC_USER', 'AUDITOR'],
  
  // System Management
  MANAGE_USERS: ['SUPER_ADMIN'],
  MANAGE_MINISTRIES: ['SUPER_ADMIN'],
  SYSTEM_AUDIT: ['SUPER_ADMIN', 'AUDITOR']
} as const;

export interface User {
  id: string;
  email: string;
  role: keyof typeof ROLES;
  permissions: string[];
  ministry_id?: string;
  contractor_id?: string;
  is_active: boolean;
}

export class AuthService {
  // Government Official Login
  async loginOfficial(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Get official details and permissions
    const { data: official } = await supabase
      .from('government_officials')
      .select('*, ministries(*)')
      .eq('email', email)
      .single();

    if (!official) {
      throw new Error('Official not found');
    }

    return {
      user: data.user,
      official,
      permissions: this.getPermissions(official.role)
    };
  }

  // Contractor Login
  async loginContractor(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    const { data: contractor } = await supabase
      .from('contractors')
      .select('*')
      .eq('email', email)
      .single();

    if (!contractor) {
      throw new Error('Contractor not found');
    }

    return {
      user: data.user,
      contractor,
      permissions: this.getPermissions('CONTRACTOR')
    };
  }

  // Public User Registration
  async registerPublicUser(userData: {
    email: string;
    firstName: string;
    lastName: string;
    organization?: string;
    userType: 'citizen' | 'journalist' | 'researcher' | 'auditor';
  }) {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: this.generateTemporaryPassword(),
    });

    if (error) throw error;

    // Create public user record
    const { data: publicUser } = await supabase
      .from('public_users')
      .insert({
        email: userData.email,
        first_name: userData.firstName,
        last_name: userData.lastName,
        organization: userData.organization,
        user_type: userData.userType,
      })
      .select()
      .single();

    return {
      user: data.user,
      publicUser,
      permissions: this.getPermissions('PUBLIC_USER')
    };
  }

  // Permission checking middleware
  async checkPermission(userId: string, permission: string): Promise<boolean> {
    const { data: user } = await supabase
      .from('government_officials')
      .select('role')
      .eq('id', userId)
      .single();

    if (!user) return false;

    const userPermissions = this.getPermissions(user.role);
    return userPermissions.includes(permission);
  }

  // Get current user with role information
  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    // Check if it's a government official
    const { data: official } = await supabase
      .from('government_officials')
      .select('*, ministries(*)')
      .eq('email', user.email)
      .single();

    if (official) {
      return {
        id: official.id,
        email: official.email,
        role: official.role as keyof typeof ROLES,
        permissions: this.getPermissions(official.role),
        ministry_id: official.ministry_id,
        is_active: official.is_active
      };
    }

    // Check if it's a contractor
    const { data: contractor } = await supabase
      .from('contractors')
      .select('*')
      .eq('email', user.email)
      .single();

    if (contractor) {
      return {
        id: contractor.id,
        email: contractor.email,
        role: 'CONTRACTOR',
        permissions: this.getPermissions('CONTRACTOR'),
        contractor_id: contractor.id,
        is_active: contractor.verification_status === 'verified'
      };
    }

    // Check if it's a public user
    const { data: publicUser } = await supabase
      .from('public_users')
      .select('*')
      .eq('email', user.email)
      .single();

    if (publicUser) {
      return {
        id: publicUser.id,
        email: publicUser.email,
        role: 'PUBLIC_USER',
        permissions: this.getPermissions('PUBLIC_USER'),
        is_active: publicUser.is_active
      };
    }

    return null;
  }

  // Logout
  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  private getPermissions(role: string): string[] {
    return ROLES[role as keyof typeof ROLES]?.permissions || [];
  }

  private generateTemporaryPassword(): string {
    return Math.random().toString(36).slice(-12);
  }
}

// Export singleton instance
export const authService = new AuthService();


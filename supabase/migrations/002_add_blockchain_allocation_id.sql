-- Add blockchain_allocation_id column to budget_allocations table
-- This stores the actual allocation ID from the blockchain contract

ALTER TABLE budget_allocations 
ADD COLUMN IF NOT EXISTS blockchain_allocation_id VARCHAR(50);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_budget_allocations_blockchain_id 
ON budget_allocations(blockchain_allocation_id);

-- Add comment
COMMENT ON COLUMN budget_allocations.blockchain_allocation_id IS 'The allocation ID returned from the blockchain smart contract';


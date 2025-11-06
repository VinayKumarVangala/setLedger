-- Materialized view for monthly financial KPIs
CREATE MATERIALIZED VIEW monthly_financial_kpis AS
SELECT 
  DATE_TRUNC('month', created_at) as month,
  organization_id,
  SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as revenue,
  SUM(CASE WHEN status = 'paid' THEN tax_amount ELSE 0 END) as tax_collected,
  SUM(CASE WHEN status = 'paid' THEN cgst_amount ELSE 0 END) as cgst,
  SUM(CASE WHEN status = 'paid' THEN sgst_amount ELSE 0 END) as sgst,
  SUM(CASE WHEN status = 'paid' THEN igst_amount ELSE 0 END) as igst,
  COUNT(*) as invoice_count,
  COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count
FROM invoices 
GROUP BY DATE_TRUNC('month', created_at), organization_id;

-- Materialized view for quarterly financial KPIs
CREATE MATERIALIZED VIEW quarterly_financial_kpis AS
SELECT 
  DATE_TRUNC('quarter', created_at) as quarter,
  organization_id,
  SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as revenue,
  SUM(CASE WHEN status = 'paid' THEN tax_amount ELSE 0 END) as tax_collected,
  COUNT(*) as invoice_count,
  AVG(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as avg_invoice_value
FROM invoices 
GROUP BY DATE_TRUNC('quarter', created_at), organization_id;

-- Materialized view for expense tracking
CREATE MATERIALIZED VIEW monthly_expenses AS
SELECT 
  DATE_TRUNC('month', created_at) as month,
  organization_id,
  SUM(amount) as total_expenses,
  COUNT(*) as expense_count
FROM journal_entries 
WHERE type = 'expense'
GROUP BY DATE_TRUNC('month', created_at), organization_id;

-- Materialized view for stock movements
CREATE MATERIALIZED VIEW monthly_stock_summary AS
SELECT 
  DATE_TRUNC('month', created_at) as month,
  organization_id,
  product_id,
  SUM(CASE WHEN move_type = 'in' THEN quantity ELSE -quantity END) as net_movement,
  COUNT(*) as movement_count
FROM stock_movements 
GROUP BY DATE_TRUNC('month', created_at), organization_id, product_id;

-- Create indexes for performance
CREATE INDEX idx_monthly_kpis_org_month ON monthly_financial_kpis(organization_id, month);
CREATE INDEX idx_quarterly_kpis_org_quarter ON quarterly_financial_kpis(organization_id, quarter);
CREATE INDEX idx_monthly_expenses_org_month ON monthly_expenses(organization_id, month);

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_financial_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_financial_kpis;
  REFRESH MATERIALIZED VIEW CONCURRENTLY quarterly_financial_kpis;
  REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_expenses;
  REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_stock_summary;
END;
$$ LANGUAGE plpgsql;
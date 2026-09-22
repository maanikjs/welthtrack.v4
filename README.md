# welthtrack.v4

## Run
```cmd
npm install
npm run dev
```
Then open http://localhost:5173.

## New analytics and money-return behavior
- Investment tab: investment value-by-type graph plus existing investment P/L and per-stock history graphs.
- Dashboard: net worth trend chart backed by daily snapshots stored in `netWorthHistory`.
- Cash Flow: six-month income/expense/cash-flow graph.
- Removing a goal automatically returns its funded amount to Savings.
- Emergency Reserve has a **Move Reserve to Savings** control that returns the current reserve amount to Savings and resets the reserve to zero.

## Notes
This is a local browser MVP. Live stock quotes require internet access to the configured market-data provider.


### Latest update
- Savings now includes linked transaction flow (income increases, expense decreases).
- Savings page includes a transaction-linked graph and manual savings management.
- Investments includes persistent stock graph shortcut buttons for tracked stocks.
- Net-worth snapshot effect is evaluated after totals are initialized.

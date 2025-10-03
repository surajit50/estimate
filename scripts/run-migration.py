import subprocess
import sys

print("[v0] Running Prisma migration to update database schema...")

try:
    # Generate Prisma Client
    print("[v0] Generating Prisma Client...")
    subprocess.run(["npx", "prisma", "generate"], check=True)
    
    # Push schema changes to database
    print("[v0] Pushing schema changes to database...")
    subprocess.run(["npx", "prisma", "db", "push"], check=True)
    
    print("[v0] ✓ Database migration completed successfully!")
    print("[v0] The following changes have been applied:")
    print("[v0]   - Added activityCode field to Estimate")
    print("[v0]   - Added cgst, sgst, lwCess, contingency fields to Estimate")
    print("[v0]   - Created SubItem model for detailed work breakdowns")
    print("[v0]   - Added relation between WorkItem and SubItem")
    
except subprocess.CalledProcessError as e:
    print(f"[v0] ✗ Migration failed: {e}", file=sys.stderr)
    sys.exit(1)

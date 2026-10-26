# Inventory

Keep trailer specifications, prices, availability and photos in one place.

## User flow

Search the lot, choose card or table view, add or edit a trailer, look up a VIN, review an AI description draft and upload photos. Choose a cover from the gallery.

## Business rules

Owners and Managers edit full records. Sales can read inventory and change manual availability, but the server excludes dealer cost. Holds and sales control reserved/sold states. VIN decoding may be incomplete; verify the trailer plate.

## Code

server/features/inventory/; app/routes/inventory*.tsx; app/components/inventory/

See the [Phase 1 tracker](../../phase-1-checklist.md) for verification evidence and remaining work.

# SAP Sales Order OData Prototype

A small reference project exploring a Node.js client for SAP Sales Order OData and a sample ABAP RAP/CDS model. The checked-in web client runs against local in-memory sample data by default. The repository has not been verified against a live SAP S/4HANA system.

## Current scope

- The Node.js client has mock implementations for listing, filtering, creating, looking up, and completing sample sales orders.
- The client contains an opt-in OData request path for a configured SAP service. This path requires a reachable SAP system and matching service metadata; it has not been validated here.
- The `abap/` directory contains example CDS, service, behavior, and class files. The create, update, and delete handlers in `zcl_sales_odata_dpc_ext.clas.abap` are incomplete.
- The Jest suite constructs the client in mock mode. It checks mock behavior; it does not prove a live SAP integration.
- ABAP artifacts require an SAP ABAP environment and are not run by the Node.js scripts.

## Run the mock web backend

Requirements: Node.js and npm.

```sh
cd web-backend
npm install
npm test
npm start
```

The mock client is the default. To try the OData request path, configure the service and credentials in the environment:

```env
SAP_MOCK_MODE=false
SAP_ODATA_BASE_URL=https://your-sap-host/sap/opu/odata4/...
SAP_USER=your-user
SAP_PASSWORD=your-password
```

Do not commit credentials. When mock mode is disabled, the client requires all three SAP connection values. The configured service URL, entity set, action name, and authentication method must match the target SAP system.

## Repository layout

- `web-backend/`: Express bridge and OData client prototype.
- `abap/`: example CDS/RAP and Gateway artifacts.
- `btp/`: example BTP deployment and security configuration files.

## Stack

TypeScript, Node.js, Express, Axios, Jest, ABAP CDS, RAP, and OData.

## Next steps

Before describing this as a working SAP integration, complete the ABAP handlers, verify the service definitions against an SAP system, add tests that exercise the real HTTP request/response path, and document the deployment and authentication setup that was actually used.

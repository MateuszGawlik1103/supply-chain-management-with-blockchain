Docs: https://hyperledger-fabric-ca.readthedocs.io/en/latest/users-guide.html

Ended at: Enrolling a peer identity

Step 1: Init config files and certs for CA
```
fabric-ca-server init -b admin:adminpw
```

Step 2: Change config files, e.g. enable TLS, change maxenrollment etc.

Step 3: start CA
```
fabric-ca-server start
```

Step 4: set FABRIC_CA_CLIENT_HOME as a home dir for admin:
```
export FABRIC_CA_CLIENT_HOME=$PWD/organizations/fabric-ca/clients/admin
```

Step 5: Enroll admin with preceding credentials. Pass CA's tls-cert (refers to only when tls enabled)
```
fabric-ca-client enroll -u https://admin:adminpw@localhost:7054 --tls.certfiles $PWD/organizations/fabric-ca/org_test/tls-cert.pem
```

Step 6: Change config of the client config (if needed)

Step 7: Register an admin2 (example attributes):
```
fabric-ca-client register --id.name admin2 --id.affiliation org1.department1 --id.attrs 'hf.Revoker=true,admin=true:ecert' --tls.certfiles $PWD/organizations/fabric-ca/org_test/tls-cert.pem -u https://localhost:7054
```

Step 8: Set Home dir for admin2:
```
export FABRIC_CA_CLIENT_HOME=$PWD/organizations/fabric-ca/clients/admin2
```

Step 9: User enrolls himself by passing password which popped up after preceding command:
```
fabric-ca-client enroll -u https://admin2:ZcSOAVMRonIX@localhost:7054 --tls.certfiles $PWD/organizations/fabric-ca/org_test/tls-cert.pem
```
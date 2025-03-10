// The 'verify_poseidon2_zpass' program.
program verify_poseidon2_zpass.aleo {
    // The ZPass record
    record ZPass {
        owner: address,
        issuer: address,
        dob: u32,
        nationality: field,
        expiry: u32,
        salt: scalar
    }

    // The private credentials struct
    struct PrivateCredentials {
        issuer: address,
        subject: address,
        dob: u32,
        nationality: field,
        expiry: u32
    }

    // The public credentials struct
    // This is the public information that is shared publicly onchain
    struct PublicCredentials {
        salt: scalar
    }

    // The full credentials struct to be hashed and verified against the signature
    struct FullCredentials {
        issuer: address,
        subject: address,
        dob: u32,
        nationality: field,
        expiry: u32,
        salt: scalar
    }

    // The mapping of issued commitments
    mapping issued: group => bool;

    // The count of issued ZPasses
    // Using key of 0field as global key
    mapping issuance_count: field => u128;

    async transition issue(
        private sig: signature,
        private pri: PrivateCredentials,
        public pub: PublicCredentials,
    ) -> (ZPass, Future) {
        // Construct the full credentials struct to be hashed and verified against the signature
        let credentials: FullCredentials = FullCredentials {
            issuer: pri.issuer,
            subject: self.caller, // The caller must be the subject of the ZPass
            dob: pri.dob,
            nationality: pri.nationality,
            expiry: pri.expiry,
            salt: pub.salt,
        };

        // Verify signature
        assert_eq(signature::verify(sig, pri.issuer, Poseidon2::hash_to_field(credentials)), true);

        // Compute commitment to prevent double issuance
        let commit: group = BHP256::commit_to_group(self.caller, pub.salt);

        // Return the ZPass record and pass the commitment to store in the mapping
        return (ZPass {
            owner: self.caller,
            issuer: pri.issuer,
            dob: pri.dob,
            nationality: pri.nationality,
            expiry: pri.expiry,
            salt: pub.salt
        }, issue_finalize(commit));
    }

    async function issue_finalize(
        public commit: group
    ) {
        // Ensure the commitment is not already issued
        assert_eq(issued.get_or_use(commit, false), false);

        // Store the commitment in the mapping
        issued.set(commit, true);
        // Increment the issuance count
        issuance_count.set(0field, issuance_count.get_or_use(0field, 0u128) + 1u128);
    }
}

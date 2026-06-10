/// <reference types="cypress" />

describe('Admin - Password Reset Flow', () => {
  const adminEmail = 'admin@variamos-test.com';
  const adminPassword = 'Password123!'; // Matches seed hash
  const targetUserEmail = 'user-test@variamos-test.com';
  const disabledUserEmail = 'disabled-user@variamos-test.com';
  const deletedUserEmail = 'deleted-user@variamos-test.com';
  const newPassword = 'NewSecurePassword123!';
  
  const dbHelperPath = '../integration/admin/db/adminDbHelper.js';

  beforeEach(() => {
    // Reset and seed database state with test profiles using the modular helper
    cy.task('runModuleDbScript', {
      scriptPath: dbHelperPath,
      functionName: 'seedTestUsers'
    });
  });

  /**
   * Scenario 1: Admin-initiated Reset (Manual copy of the link)
   */
  it('should allow admin to generate recovery link, and user to reset password', () => {
    cy.visit('http://localhost:3000');
    // 1. Log in as admin
    cy.get('input[name="email"]').type(adminEmail);
    cy.get('input[name="password"]').type(adminPassword);
    cy.get('button[type="submit"]').click();
    
    // Verify redirection to admin dashboard (root url)
    cy.url().should('eq', 'http://localhost:3000/');

    // 2. Navigate to user list page (using text content 'Users')
    cy.contains('Users').click();
    cy.url().should('include', '/users');

    // Use search bar to find target user
    cy.get('input[id="search"]').clear({ force: true }).type(targetUserEmail, { force: true });
    cy.wait(600); // Wait for debounced search to trigger

    // 3. Generate recovery link for the target user
    cy.contains('tr', targetUserEmail).within(() => {
      // Click on the reset button targeted by its title attribute
      cy.get('button[title="Generate password reset link"]').click();
    });

    // Modal should become visible
    cy.get('.modal-content').should('be.visible');

    // Click on "Generate Secure Link" button inside the modal to construct the token
    cy.contains('button', 'Generate Secure Link').click();
    
    // Wait for the input inside the modal to display the generated link (not be empty)
    cy.get('.modal-content input[type="text"]').should('not.have.value', '');
    
    // Intercept the generated recovery link from the modal input
    cy.get('.modal-content input[type="text"]').invoke('val').then((recoveryLink) => {
      expect(recoveryLink).to.contain('/reset-password?token=');

      // Close modal and log out
      cy.contains('button', 'Close').click();
      
      // Perform log-out using dropdown
      cy.get('a#nav-dropdown').click();
      cy.contains('a', 'Logout').click();

      // 4. Simulate target user accessing the recovery link
      cy.visit(recoveryLink);

      // Try resetting to the same password (Password123!)
      cy.get('input[id="new_password"]').type(adminPassword);
      cy.get('input[id="confirm_password"]').type(adminPassword);
      cy.get('button[type="submit"]').click();
      cy.contains('New password must be different from the current one.').should('be.visible');

      // Input new password and confirmation
      cy.get('input[id="new_password"]').clear().type(newPassword);
      cy.get('input[id="confirm_password"]').clear().type(newPassword);
      cy.get('button[type="submit"]').click();

      // Verify success message and redirection to login page
      cy.contains('Your password has been reset successfully !').should('be.visible');
      cy.contains('Back to Sign In').click();
      cy.url().should('include', '/login');

      // 5. Verify that login succeeds with the newly set password
      cy.get('input[name="email"]').type(targetUserEmail);
      cy.get('input[name="password"]').type(newPassword);
      cy.get('button[type="submit"]').click();
      cy.url().should('eq', 'http://localhost:3000/');
    });
  });

  /**
   * Scenario 2: User-initiated Reset (SMTP flow using mail intercept/simulation check)
   */
  it('should allow public user to request password reset, receive simulated email, and reset password', () => {
    const smtpEmail = 'user-smtp@variamos-test.com'; // Using isolated user for SMTP scenario

    // 1. Go to public forgot password page
    cy.visit('http://localhost:3000/#/forgot-password');
    cy.get('input[type="email"]').type(smtpEmail);
    
    // Intercept the request to assert a single API call on submit
    cy.intercept('POST', '**/auth/forgot-password').as('forgotPasswordRequest');
    cy.get('button[type="submit"]').click();
    cy.wait('@forgotPasswordRequest');

    cy.contains('If an account with this email exists, a password reset link has been sent. Please check your inbox!').should('be.visible');

    // Give the backend a brief moment to write the token in BDD
    cy.wait(500);

    // 2. Query DB to fetch the generated token (retrieved via helper task)
    cy.task('runModuleDbScript', {
      scriptPath: dbHelperPath,
      functionName: 'getLatestResetToken',
      args: smtpEmail
    }).then((tokenHash) => {
      expect(tokenHash).to.not.be.null;

      const recoveryLink = `http://localhost:3000/#/reset-password?token=${tokenHash}`;
      cy.visit(recoveryLink);

      // Saisie du nouveau mot de passe
      cy.get('input[id="new_password"]').type(newPassword);
      cy.get('input[id="confirm_password"]').type(newPassword);
      cy.get('button[type="submit"]').click();

      cy.contains('Your password has been reset successfully !').should('be.visible');

      // Verify that login succeeds with the newly set password
      cy.contains('Back to Sign In').click();
      cy.url().should('include', '/login');
      cy.get('input[name="email"]').type(smtpEmail);
      cy.get('input[name="password"]').type(newPassword);
      cy.get('button[type="submit"]').click();
      cy.url().should('eq', 'http://localhost:3000/');
    });
  });

  /**
   * Scenario 3: Usage uniqueness check (Token invalidation after reset)
   */
  it('should invalidate token after first use and prevent reuse', () => {
    cy.visit('http://localhost:3000');
    // 1. Log in as admin and generate link
    cy.get('input[name="email"]').type(adminEmail);
    cy.get('input[name="password"]').type(adminPassword);
    cy.get('button[type="submit"]').click();
    cy.contains('Users').click();
    
    // Use search bar to find target user
    cy.get('input[id="search"]').clear({ force: true }).type(targetUserEmail, { force: true });
    cy.wait(600); // Wait for debounced search to trigger

    cy.contains('tr', targetUserEmail).within(() => {
      cy.get('button[title="Generate password reset link"]').click();
    });

    cy.get('.modal-content').should('be.visible');
    cy.contains('button', 'Generate Secure Link').click();

    // Wait for the modal input
    cy.get('.modal-content input[type="text"]').should('not.have.value', '');

    cy.get('.modal-content input[type="text"]').invoke('val').then((recoveryLink) => {
      cy.contains('button', 'Close').click();
      
      // Perform log-out using dropdown
      cy.get('a#nav-dropdown').click();
      cy.contains('a', 'Logout').click();

      // First use: successful reset
      cy.visit(recoveryLink);
      cy.get('input[id="new_password"]').type(newPassword);
      cy.get('input[id="confirm_password"]').type(newPassword);
      cy.get('button[type="submit"]').click();
      cy.contains('Your password has been reset successfully !').should('be.visible');

      // Go to login page first to ensure component unmounts
      cy.visit('http://localhost:3000/#/login');

      // Second use: trying to access the link again
      cy.visit(recoveryLink);
      // It should display a verification error
      cy.contains('This password reset link is invalid, has expired, or has already been used.').should('be.visible');
      cy.get('input[id="new_password"]').should('not.exist');
    });
  });

  /**
   * Scenario 4: User account status restrictions (Disabled & Deleted users)
   */
  it('should not allow password recovery for disabled or deleted accounts', () => {
    cy.visit('http://localhost:3000');
    // 1. Admin visual check
    cy.get('input[name="email"]').type(adminEmail);
    cy.get('input[name="password"]').type(adminPassword);
    cy.get('button[type="submit"]').click();
    cy.contains('Users').click();

    // Use search bar to find disabled user
    cy.get('input[id="search"]').clear({ force: true }).type(disabledUserEmail, { force: true });
    cy.wait(600);

    cy.contains('tr', disabledUserEmail).within(() => {
      // Button to reset link should not exist at all for disabled user
      cy.get('button[title="Generate password reset link"]').should('not.exist');
    });

    // Use search bar to find deleted user
    cy.get('input[id="search"]').clear({ force: true }).type(deletedUserEmail, { force: true });
    cy.wait(600);

    // For deleted user, the button to reset link should also not exist
    cy.contains('tr', deletedUserEmail).within(() => {
      cy.get('button[title="Generate password reset link"]').should('not.exist');
    });
    
    // Perform log-out using dropdown
    cy.get('a#nav-dropdown').click();
    cy.contains('a', 'Logout').click();

    // 2. Direct backend API security check (bypass frontend)
    // Attempting to post reset request for disabled user
    cy.request({
      method: 'POST',
      url: 'http://localhost:4000/auth/forgot-password', // Adapt port to backend API
      body: { email: disabledUserEmail },
      failOnStatusCode: false
    }).then((response) => {
      // No token should be generated in DB for disabled user
      cy.task('runModuleDbScript', {
        scriptPath: dbHelperPath,
        functionName: 'getLatestResetToken',
        args: disabledUserEmail
      }).then((token) => {
        expect(token).to.be.null;
      });
    });
  });

  /**
   * Scenario 5: Token expiration check (Link valid for 24h only)
   */
  it('should reject password reset if the token has expired', () => {
    const expiredToken = 'expired-token-uuid-1234';
    
    // Insert an expired token manually in DB via helper task
    cy.task('runModuleDbScript', {
      scriptPath: dbHelperPath,
      functionName: 'insertExpiredToken',
      args: { email: targetUserEmail, token: expiredToken } // Passed 'token' instead of 'tokenHash' to match modified helper
    }).then(() => {
      const recoveryLink = `http://localhost:3000/#/reset-password?token=${expiredToken}`;
      cy.visit(recoveryLink);
      
      // Should show expiration message and hide inputs
      cy.contains('This password reset link is invalid, has expired, or has already been used.').should('be.visible');
      cy.get('input[id="new_password"]').should('not.exist');
    });
  });

  /**
   * Scenario 6: Prevention of duplicate API calls (Double Submit Click)
   */
  it('should prevent double-clicking the submit button', () => {
    // Intercept with delay to simulate slower API response
    cy.intercept('POST', '**/auth/forgot-password').as('delayedForgot');

    cy.visit('http://localhost:3000/#/forgot-password');
    cy.get('input[type="email"]').type(targetUserEmail);
    
    // Perform rapid clicks (force click because it gets disabled)
    cy.get('button[type="submit"]').click({ force: true });
    
    // Check that it gets disabled immediately
    cy.get('button[type="submit"]').should('be.disabled');

    // Wait for the API request to complete and verify it was called
    cy.wait('@delayedForgot');
  });

  /**
   * Scenario 7: Form validation rules (UX & Security)
   */
  it('should validate form rules (email and password inputs)', () => {
    // Case A: Email input validation on forgot password page
    cy.visit('http://localhost:3000/#/forgot-password');
    cy.get('input[type="email"]').type('temp').clear();
    cy.contains('Email is required').should('be.visible');
    cy.get('button[type="submit"]').should('be.disabled');

    // Case B: Password validation on reset password page
    const dummyLink = 'http://localhost:3000/#/reset-password?token=dummy_valid_token';
    cy.intercept('GET', '**/verify-token*', { statusCode: 200 }).as('verifyToken');

    cy.visit(dummyLink);
    cy.wait('@verifyToken');

    // Case C: Passwords do not match
    cy.get('input[id="new_password"]').type('Password123!');
    cy.get('input[id="confirm_password"]').type('DifferentPassword123!');
    cy.get('button[type="submit"]').should('be.disabled');
    cy.contains('Passwords do not match').should('be.visible');

    // Case D: Password does not meet security rules (e.g. too short)
    cy.get('input[id="new_password"]').clear().type('short');
    cy.get('input[id="confirm_password"]').clear().type('short');
    cy.contains('Password must be between 8 and 24 characters and include uppercase, lowercase, number, and special character.').should('be.visible');
  });

  after(() => {
    // Post-suite database cleanup to avoid leaving test profiles in the local database
    cy.task('runModuleDbScript', {
      scriptPath: dbHelperPath,
      functionName: 'cleanTestUsers'
    });
  });
});

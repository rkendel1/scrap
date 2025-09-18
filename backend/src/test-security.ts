import { EmbedSecurityService } from './embed-security-service';

// Test the security service functionality
console.log('🔒 Testing FormCraft AI Security System');
console.log('=====================================\n');

const embedSecurity = new EmbedSecurityService();

// Test 1: Generate embed token
console.log('1. Testing embed token generation...');
const formId = 123;
const userId = 456;
const subscriptionTier = 'paid';
const allowedDomains = ['example.com', '*.mydomain.com'];

const token = embedSecurity.generateEmbedToken(formId, userId, subscriptionTier, allowedDomains);
console.log('✅ Generated token:', token.substring(0, 50) + '...');

// Test 2: Verify token
console.log('\n2. Testing token verification...');
const payload = embedSecurity.verifyEmbedToken(token);
if (payload) {
    console.log('✅ Token verified successfully');
    console.log('   - Form ID:', payload.formId);
    console.log('   - User ID:', payload.userId);
    console.log('   - Subscription:', payload.subscriptionTier);
    console.log('   - Allowed domains:', payload.allowedDomains);
} else {
    console.log('❌ Token verification failed');
}

// Test 3: Domain validation
console.log('\n3. Testing domain validation...');
const testCases = [
    { hostname: 'example.com', expected: true },
    { hostname: 'www.example.com', expected: true },
    { hostname: 'sub.mydomain.com', expected: true },
    { hostname: 'evil.com', expected: false },
    { hostname: 'notallowed.com', expected: false }
];

testCases.forEach(testCase => {
    const isAllowed = embedSecurity.isDomainAllowed(testCase.hostname, allowedDomains);
    const status = isAllowed === testCase.expected ? '✅' : '❌';
    console.log(`   ${status} ${testCase.hostname}: ${isAllowed ? 'ALLOWED' : 'BLOCKED'}`);
});

// Test 4: Invalid token
console.log('\n4. Testing invalid token handling...');
const invalidPayload = embedSecurity.verifyEmbedToken('invalid.token.here');
console.log(invalidPayload ? '❌ Should reject invalid token' : '✅ Invalid token rejected');

console.log('\n🎉 Security system test completed!');
console.log('\n📋 Implementation Summary:');
console.log('   • JWT tokens with 1-hour expiration');
console.log('   • Domain whitelist with wildcard support');
console.log('   • Subscription tier validation');
console.log('   • Rate limiting by tier (10/100 per hour)');
console.log('   • Secure embed.js script generation');
console.log('   • Enhanced form submission validation');
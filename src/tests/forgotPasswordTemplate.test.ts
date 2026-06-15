// forgotPasswordTemplate.test.ts
import { describe, expect, it } from '@jest/globals';

describe('forgotPasswordTemplate', () => {

    it('should return html template', async () => {
        const { forgotPasswordTemplate } =
            await import('../../src/templates/forgotPasswordTemplate.js');

        const result = forgotPasswordTemplate(
            'http://localhost/reset/token'
        );

        expect(typeof result).toBe('string');
    });

    it('should include reset link in button href', async () => {
        const { forgotPasswordTemplate } =
            await import('../../src/templates/forgotPasswordTemplate.js');

        const resetLink =
            'http://localhost/reset/token';

        const result = forgotPasswordTemplate(resetLink);

        expect(result).toContain(
            `href="${resetLink}"`
        );
    });

    it('should include reset link in link box', async () => {
        const { forgotPasswordTemplate } =
            await import('../../src/templates/forgotPasswordTemplate.js');

        const resetLink =
            'http://localhost/reset/token';

        const result = forgotPasswordTemplate(resetLink);

        expect(result).toContain(
            `<p class="link-box">${resetLink}</p>`
        );
    });

    it('should include reset password heading', async () => {
        const { forgotPasswordTemplate } =
            await import('../../src/templates/forgotPasswordTemplate.js');

        const result = forgotPasswordTemplate(
            'http://localhost/reset/token'
        );

        expect(result).toContain(
            'Reset Your Password'
        );
    });

    it('should include expiration warning', async () => {
        const { forgotPasswordTemplate } =
            await import('../../src/templates/forgotPasswordTemplate.js');

        const result = forgotPasswordTemplate(
            'http://localhost/reset/token'
        );

        expect(result).toContain(
            'This link will expire in 15 minutes'
        );
    });

    it('should include footer text', async () => {
        const { forgotPasswordTemplate } =
            await import('../../src/templates/forgotPasswordTemplate.js');

        const result = forgotPasswordTemplate(
            'http://localhost/reset/token'
        );

        expect(result).toContain(
            'This is an automated message, please do not reply.'
        );
    });

    it('should include html structure', async () => {
        const { forgotPasswordTemplate } =
            await import('../../src/templates/forgotPasswordTemplate.js');

        const result = forgotPasswordTemplate(
            'http://localhost/reset/token'
        );

        expect(result).toContain('<html');

        expect(result).toContain('</html>');
    });

    it('should include button text', async () => {
        const { forgotPasswordTemplate } =
            await import('../../src/templates/forgotPasswordTemplate.js');

        const result = forgotPasswordTemplate(
            'http://localhost/reset/token'
        );

        expect(result).toContain(
            'Reset Password'
        );
    });
});
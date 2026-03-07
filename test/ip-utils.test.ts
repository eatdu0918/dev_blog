import { describe, it, expect } from 'vitest';
import { isValidIP, isLocalhost, isIPv4, isIPv6 } from './ip-utils';

describe('IP Utilities', () => {
    describe('isValidIP', () => {
        it('should return true for valid IPv4 addresses', () => {
            expect(isValidIP('192.168.0.1')).toBe(true);
            expect(isValidIP('8.8.8.8')).toBe(true);
            expect(isValidIP('127.0.0.1')).toBe(true);
        });

        it('should return true for valid IPv6 addresses', () => {
            expect(isValidIP('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true);
            expect(isValidIP('::1')).toBe(true);
            expect(isValidIP('2001:db8::ff00:42:8329')).toBe(true);
        });

        it('should return false for invalid IP addresses', () => {
            expect(isValidIP('256.256.256.256')).toBe(false);
            expect(isValidIP('abc.def.ghi.jkl')).toBe(false);
            expect(isValidIP('123.456.78.9')).toBe(false);
            expect(isValidIP('2001:db8:::1')).toBe(false);
        });
    });

    describe('isLocalhost', () => {
        it('should return true for localhost addresses', () => {
            expect(isLocalhost('127.0.0.1')).toBe(true);
            expect(isLocalhost('::1')).toBe(true);
            expect(isLocalhost('localhost')).toBe(true);
        });

        it('should return false for non-localhost addresses', () => {
            expect(isLocalhost('192.168.0.1')).toBe(false);
            expect(isLocalhost('8.8.8.8')).toBe(false);
        });
    });

    describe('isIPv4', () => {
        it('should return true for IPv4 and false for IPv6', () => {
            expect(isIPv4('192.168.0.1')).toBe(true);
            expect(isIPv4('::1')).toBe(false);
        });
    });

    describe('isIPv6', () => {
        it('should return true for IPv6 and false for IPv4', () => {
            expect(isIPv6('::1')).toBe(true);
            expect(isIPv6('192.168.0.1')).toBe(false);
        });
    });
});

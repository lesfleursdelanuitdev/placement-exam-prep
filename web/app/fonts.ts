// The plain page's fonts (IBM Plex and STIX Two), downloaded by next/font when the app is built
// and served from this site: visitors' browsers never ask Google (plan Q5, and the CSP's font-src).
import { IBM_Plex_Mono, IBM_Plex_Sans, IBM_Plex_Sans_Condensed, STIX_Two_Text } from 'next/font/google';

export const plexSans = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], style: ['normal', 'italic'], variable: '--font-plex-sans', display: 'swap' });
export const plexCond = IBM_Plex_Sans_Condensed({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-plex-cond', display: 'swap' });
export const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-plex-mono', display: 'swap' });
export const stix = STIX_Two_Text({ subsets: ['latin'], weight: ['400', '600'], style: ['normal', 'italic'], variable: '--font-stix', display: 'swap' });

export const fontVariables = [plexSans, plexCond, plexMono, stix].map((f) => f.variable).join(' ');

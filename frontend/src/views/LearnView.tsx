import React, { useState } from 'react';
import {
  BookOpen,
  Lock,
  Shield,
  HelpCircle,
  Cpu,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const LearnView: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const faqList = [
    {
      q: 'Why is SHA-256 chosen over MD5 or SHA-1 for file integrity verification?',
      a: 'MD5 and SHA-1 have proven practical collision vulnerabilities (e.g., Wang et al. 2004 for MD5, SHAttered 2017 for SHA-1), allowing attackers to generate two distinct files with identical hashes. SHA-256 belongs to the SHA-2 family specified in FIPS 180-4 and provides 128 bits of security against collision attacks and 256 bits against preimage attacks, with no known practical collisions.',
    },
    {
      q: 'What is the Strict Avalanche Criterion (SAC)?',
      a: 'The Avalanche Effect is a fundamental property of high-quality cryptographic hash functions where flipping a single bit in the input message causes an average of 50% of the output bits in the digest to change unpredictably. In SecureFile, you can see this directly in the Nibble Comparison visualizer—changing one punctuation mark produces a completely disparate 64-character hex string.',
    },
    {
      q: 'What are the four states detected in File Integrity Monitoring (FIM)?',
      a: 'The four states are: (1) UNCHANGED: File exists in baseline and its SHA-256 hash matches exactly. (2) MODIFIED: File exists in baseline but its hash differs, indicating alteration or tampering. (3) NEW: File was detected in the scan but was absent from baseline. (4) MISSING: File is specified in baseline but absent from current scan.',
    },
    {
      q: 'Why can we not simply rely on file modification timestamps (MAC times)?',
      a: 'Timestamps (Modified, Accessed, Created) are stored in the filesystem metadata, not cryptographically tied to content. Attackers can trivially alter timestamps using "timestomping" techniques or touch commands to hide unauthorized edits. Cryptographic hashing computes a digest strictly from the file’s raw bytes.',
    },
    {
      q: 'Does a matching SHA-256 hash prove file authenticity or origin?',
      a: 'No. Hashing ensures integrity (i.e., the content has not changed since the baseline was recorded), but it does not authenticate who authored the file or protect against an attacker who simultaneously modifies both the file and the baseline manifest. For authenticity and non-repudiation, digital signatures (asymmetric cryptography like RSA/ECDSA) or HMACs are required.',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-electric-blue/10 border border-electric-blue/30 rounded-full mb-3 text-xs text-electric-blue font-medium">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Information & Network Security (INS) Study Guide</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Cryptographic Principles of File Integrity
        </h2>
        <p className="text-sm text-gray-400 mt-1 leading-relaxed">
          Fundamental concepts, mathematical properties, and viva preparation notes on SHA-256 and Host-based Intrusion Detection Systems (HIDS).
        </p>
      </div>

      {/* 3 Core Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-navy-800/60 border border-navy-700 rounded-xl p-5 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-electric-blue/10 border border-electric-blue/30 flex items-center justify-center text-electric-blue">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Pre-Image Resistance</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Given a 256-bit hash <span className="font-mono text-gray-200">h</span>, it is computationally infeasible to find any original message <span className="font-mono text-gray-200">m</span> such that <span className="font-mono text-gray-200">hash(m) = h</span>. This is the "one-way" property required for password storage and integrity assertions.
          </p>
        </div>

        <div className="bg-navy-800/60 border border-navy-700 rounded-xl p-5 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Collision Resistance</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            It is computationally infeasible to find any two distinct files <span className="font-mono text-gray-200">m₁ ≠ m₂</span> such that <span className="font-mono text-gray-200">hash(m₁) = hash(m₂)</span>. By the birthday paradox, searching for collisions takes <span className="font-mono text-gray-200">2¹²⁸</span> operations, rendering collisions virtually impossible today.
          </p>
        </div>

        <div className="bg-navy-800/60 border border-navy-700 rounded-xl p-5 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Strict Avalanche Effect</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            A small variation in input (even flipping 1 bit) causes high diffusion across all 64 rounds of compression, resulting in an entirely uncorrelated output hash. SecureFile demonstrates this when comparing modified files.
          </p>
        </div>
      </div>

      {/* Internal Architecture of SHA-256 */}
      <div className="bg-navy-800/60 border border-navy-700 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-electric-blue" />
          <h3 className="text-lg font-bold text-white">How SHA-256 Processes Data Internally</h3>
        </div>
        <p className="text-xs text-gray-300 leading-relaxed">
          SHA-256 is built on the <strong>Merkle-Damgård construction</strong> with the Davies-Meyer compression function. The process involves:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-navy-900/60 rounded-lg border border-navy-700/60">
            <span className="text-electric-blue font-bold block mb-1">Step 1: Padding</span>
            <span className="text-gray-400">
              Message is appended with a '1' bit, followed by zeros, so its bit length is congruent to 448 mod 512.
            </span>
          </div>

          <div className="p-3 bg-navy-900/60 rounded-lg border border-navy-700/60">
            <span className="text-electric-blue font-bold block mb-1">Step 2: Length Append</span>
            <span className="text-gray-400">
              The original 64-bit message length integer is appended to make the total bits an exact multiple of 512.
            </span>
          </div>

          <div className="p-3 bg-navy-900/60 rounded-lg border border-navy-700/60">
            <span className="text-electric-blue font-bold block mb-1">Step 3: Initial Hash</span>
            <span className="text-gray-400">
              8 32-bit state registers (A-H) are initialized with fractional parts of square roots of first 8 primes.
            </span>
          </div>

          <div className="p-3 bg-navy-900/60 rounded-lg border border-navy-700/60">
            <span className="text-electric-blue font-bold block mb-1">Step 4: 64 Rounds</span>
            <span className="text-gray-400">
              Each 512-bit block is expanded into 64 words and passes through bitwise Choice, Majority, and Rotations.
            </span>
          </div>
        </div>
      </div>

      {/* College Viva Q&A Accordion */}
      <div className="bg-navy-800/60 border border-navy-700 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-bold text-white">Information and Network Security Viva Questions</h3>
        </div>
        <p className="text-xs text-gray-400">
          Frequently asked oral examination questions about File Integrity Monitoring and hashing algorithms:
        </p>

        <div className="space-y-3 pt-2">
          {faqList.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-lg border border-navy-700/80 bg-navy-900/50 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-3 text-sm font-semibold text-gray-200 hover:text-white transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-electric-blue font-mono">Q{idx + 1}.</span>
                    <span>{item.q}</span>
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-gray-400 leading-relaxed border-t border-navy-800/80">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

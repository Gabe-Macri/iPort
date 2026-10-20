/**
 * typedstream.js
 * Decodes Apple NSAttributedString / typedstream blobs from iMessage's attributedBody column.
 */

export function parseAttributedBody(blob) {
  if (!blob) return '';
  if (typeof blob === 'string') return blob.trim();

  let buf;
  if (Buffer.isBuffer(blob)) {
    buf = blob;
  } else if (blob instanceof Uint8Array) {
    buf = Buffer.from(blob);
  } else {
    try {
      buf = Buffer.from(blob);
    } catch {
      return '';
    }
  }

  if (buf.length === 0) return '';

  // Check if buffer contains streamtyped or typedstream signature
  const headerPreview = buf.subarray(0, 32).toString('latin1');
  const isStreamtyped = headerPreview.includes('streamtyped');
  const isTypedstream = headerPreview.includes('typedstream');

  if (isStreamtyped || isTypedstream) {
    const isLittleEndian = isStreamtyped;

    // Strategy 1: Look for standard NSString marker [0x01, 0x2b]
    const marker = Buffer.from([0x01, 0x2b]);
    let markerIdx = buf.indexOf(marker);

    // If not found, try [0x84, 0x01, 0x2b]
    if (markerIdx === -1) {
      const altMarker = Buffer.from([0x84, 0x01, 0x2b]);
      const found = buf.indexOf(altMarker);
      if (found !== -1) {
        markerIdx = found + 1;
      }
    }

    if (markerIdx !== -1) {
      let offset = markerIdx + 2;
      if (offset < buf.length) {
        const flag = buf[offset++];
        let length = -1;

        if (flag < 0x80) {
          length = flag;
        } else if (flag === 0x81 && offset + 2 <= buf.length) {
          length = isLittleEndian ? buf.readUInt16LE(offset) : buf.readUInt16BE(offset);
          offset += 2;
        } else if (flag === 0x82 && offset + 4 <= buf.length) {
          length = isLittleEndian ? buf.readUInt32LE(offset) : buf.readUInt32BE(offset);
          offset += 4;
        }

        if (length > 0 && offset + length <= buf.length) {
          const str = buf.subarray(offset, offset + length).toString('utf8');
          const cleaned = cleanAppleString(str);
          if (cleaned.length > 0) return cleaned;
        }
      }
    }

    // Strategy 2: Scan for NSString text payload heuristics
    // Attributed strings often store the plain text following an NSString marker before attributes
    const nsStringMarker = Buffer.from('NSString');
    const nsIdx = buf.indexOf(nsStringMarker);
    if (nsIdx !== -1) {
      let pos = nsIdx + nsStringMarker.length;
      // Skip type bytes
      while (pos < buf.length && buf[pos] <= 0x20) pos++;
      if (pos < buf.length) {
        const flag = buf[pos++];
        let len = -1;
        if (flag < 0x80) {
          len = flag;
        } else if (flag === 0x81 && pos + 2 <= buf.length) {
          len = isLittleEndian ? buf.readUInt16LE(pos) : buf.readUInt16BE(pos);
          pos += 2;
        }
        if (len > 0 && pos + len <= buf.length) {
          const str = buf.subarray(pos, pos + len).toString('utf8');
          const cleaned = cleanAppleString(str);
          if (cleaned.length > 0) return cleaned;
        }
      }
    }
  }

  // Fallback: heuristic extraction of UTF-8 printable string segments
  // Filter out typedstream keywords and control chars
  return extractPrintableFallback(buf);
}

function cleanAppleString(str) {
  // \uFFFC is the Object Replacement Character (used by Apple for attachments/inline images)
  return str.replace(/\uFFFC/g, '').trim();
}

function extractPrintableFallback(buf) {
  try {
    const raw = buf.toString('utf8');
    // Remove known typedstream keywords
    const filtered = raw
      .replace(/streamtyped[^\n]*/g, '')
      .replace(/NSMutableAttributedString[^\n]*/g, '')
      .replace(/NSAttributedString[^\n]*/g, '')
      .replace(/NSDictionary[^\n]*/g, '')
      .replace(/NSFont[^\n]*/g, '')
      .replace(/NSColor[^\n]*/g, '')
      .replace(/NSNumber[^\n]*/g, '')
      .replace(/__kIM[^\n]*/g, '')
      .replace(/\uFFFC/g, '')
      // Remove unprintable control characters except newline and tab
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
      .trim();

    return filtered;
  } catch {
    return '';
  }
}

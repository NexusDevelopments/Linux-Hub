const keyBytes = new TextEncoder().encode(
  btoa(new Date().toISOString().slice(0, 10) + window.location.host)
    .split('')
    .reverse()
    .join('')
    .slice(6.7),
);

export const mango = {
  enc: (value) => {
    if (!value) {
      return value;
    }

    try {
      const encoded = new TextEncoder().encode(value);
      const output = new Uint8Array(encoded.length);

      for (let index = 0; index < encoded.length; index += 1) {
        output[index] = encoded[index] ^ keyBytes[index % 8];
      }

      return Array.from(output, (byte) => byte.toString(16).padStart(2, '0')).join('');
    } catch {
      return value;
    }
  },
  dnc: (value) => {
    if (!value) {
      return value;
    }

    try {
      const boundary =
        Math.min(
          value.indexOf('?') + 1 || value.length + 1,
          value.indexOf('#') + 1 || value.length + 1,
          value.indexOf('&') + 1 || value.length + 1,
        ) - 1;
      let hexLength = 0;

      for (let index = 0; index < boundary && index < value.length; index += 1) {
        const charCode = value.charCodeAt(index);
        const isHexDigit =
          (charCode >= 48 && charCode <= 57) ||
          (charCode >= 65 && charCode <= 70) ||
          (charCode >= 97 && charCode <= 102);

        if (!isHexDigit) {
          break;
        }

        hexLength = index + 1;
      }

      if (hexLength < 2 || hexLength % 2 !== 0) {
        return decodeURIComponent(value);
      }

      const output = new Uint8Array(hexLength / 2);

      for (let index = 0; index < output.length; index += 1) {
        const offset = index * 2;
        output[index] = parseInt(value[offset] + value[offset + 1], 16) ^ keyBytes[index % 8];
      }

      return new TextDecoder().decode(output) + value.slice(hexLength);
    } catch {
      return decodeURIComponent(value);
    }
  },
};

export const makeCodec = () => ({
  encode: `(value) => {
    if (!value) return value;
    try {
      const keyBytes = new TextEncoder().encode(
        btoa(new Date().toISOString().slice(0, 10) + location.host)
          .split('')
          .reverse()
          .join('')
          .slice(6.7)
      );
      const encoded = new TextEncoder().encode(value);
      const output = new Uint8Array(encoded.length);
      for (let index = 0; index < encoded.length; index += 1) {
        output[index] = encoded[index] ^ keyBytes[index % 8];
      }
      return Array.from(output, (byte) => byte.toString(16).padStart(2, '0')).join('');
    } catch {
      return value;
    }
  }`,
  decode: `(value) => {
    if (!value) return value;
    try {
      const keyBytes = new TextEncoder().encode(
        btoa(new Date().toISOString().slice(0, 10) + location.host)
          .split('')
          .reverse()
          .join('')
          .slice(6.7)
      );
      const boundary = Math.min(
        value.indexOf('?') + 1 || value.length + 1,
        value.indexOf('#') + 1 || value.length + 1,
        value.indexOf('&') + 1 || value.length + 1,
      ) - 1;
      let hexLength = 0;
      for (let index = 0; index < boundary && index < value.length; index += 1) {
        const charCode = value.charCodeAt(index);
        const isHexDigit =
          (charCode >= 48 && charCode <= 57) ||
          (charCode >= 65 && charCode <= 70) ||
          (charCode >= 97 && charCode <= 102);
        if (!isHexDigit) break;
        hexLength = index + 1;
      }
      if (hexLength < 2 || hexLength % 2 !== 0) return decodeURIComponent(value);
      const output = new Uint8Array(hexLength / 2);
      for (let index = 0; index < output.length; index += 1) {
        const offset = index * 2;
        output[index] = parseInt(value[offset] + value[offset + 1], 16) ^ keyBytes[index % 8];
      }
      return new TextDecoder().decode(output) + value.slice(hexLength);
    } catch {
      return decodeURIComponent(value);
    }
  }`,
});
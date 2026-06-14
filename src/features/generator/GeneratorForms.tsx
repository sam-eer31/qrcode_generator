import React, { useEffect, useState } from 'react';
import { Input, Label, Select } from '../../components/ui/Input';
import { parseQRData } from '../../utils/qrUtils';

interface FormProps {
  initialText: string;
  onChange: (value: string) => void;
}

// 1. URL Form
export const UrlForm: React.FC<FormProps> = ({ initialText, onChange }) => {
  const [url, setUrl] = useState(initialText);

  useEffect(() => {
    onChange(url);
  }, [url, onChange]);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="url-input">Website URL</Label>
        <Input
          id="url-input"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
        />
      </div>
    </div>
  );
};

// 2. Text Form
export const TextForm: React.FC<FormProps> = ({ initialText, onChange }) => {
  const [text, setText] = useState(initialText);

  useEffect(() => {
    onChange(text);
  }, [text, onChange]);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="text-input">Plain Text</Label>
        <textarea
          id="text-input"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your message here..."
          className="w-full px-4 py-2.5 text-sm rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-black/50 backdrop-blur-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all resize-none"
        />
      </div>
    </div>
  );
};

// 3. WiFi Form
export const WifiForm: React.FC<FormProps> = ({ initialText, onChange }) => {
  const parsed = parseQRData(initialText);
  const [ssid, setSsid] = useState(parsed.type === 'wifi' ? parsed.details.SSID : 'HomeNetwork');
  const [password, setPassword] = useState(
    parsed.type === 'wifi' ? (parsed.details.Password === '(None)' ? '' : parsed.details.Password) : 'SecretPassword'
  );
  const [encryption, setEncryption] = useState(
    parsed.type === 'wifi' ? (parsed.details.Encryption === 'WEP/WPA' ? 'WPA' : parsed.details.Encryption) : 'WPA'
  );
  const [hidden, setHidden] = useState(parsed.type === 'wifi' ? parsed.details.Hidden === 'Yes' : false);

  useEffect(() => {
    const hiddenStr = hidden ? 'H:true;' : '';
    const wifiString = `WIFI:S:${ssid};T:${encryption};P:${password};${hiddenStr};`;
    onChange(wifiString);
  }, [ssid, password, encryption, hidden, onChange]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="wifi-ssid">Network Name (SSID)</Label>
          <Input
            id="wifi-ssid"
            type="text"
            value={ssid}
            onChange={(e) => setSsid(e.target.value)}
            placeholder="e.g. My Home WiFi"
          />
        </div>
        <div>
          <Label htmlFor="wifi-encryption">Security Type</Label>
          <Select
            id="wifi-encryption"
            value={encryption}
            onChange={(e) => setEncryption(e.target.value)}
            options={[
              { value: 'WPA', label: 'WPA/WPA2' },
              { value: 'WEP', label: 'WEP' },
              { value: 'nopass', label: 'Unsecured (No Password)' },
            ]}
          />
        </div>
      </div>
      {encryption !== 'nopass' && (
        <div>
          <Label htmlFor="wifi-password">Password</Label>
          <Input
            id="wifi-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Network password"
          />
        </div>
      )}
      <div className="flex items-center space-x-2.5 pt-1.5">
        <input
          id="wifi-hidden"
          type="checkbox"
          checked={hidden}
          onChange={(e) => setHidden(e.target.checked)}
          className="h-4 w-4 rounded border-neutral-300 dark:border-neutral-800 text-accent focus:ring-accent/40"
        />
        <label htmlFor="wifi-hidden" className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 select-none">
          Hidden network (SSID is not broadcasting)
        </label>
      </div>
    </div>
  );
};

// 4. Email Form
export const EmailForm: React.FC<FormProps> = ({ initialText, onChange }) => {
  const parsed = parseQRData(initialText);
  const [recipient, setRecipient] = useState(parsed.type === 'email' ? parsed.details.Recipient : 'hello@qrstudio.dev');
  const [subject, setSubject] = useState(parsed.type === 'email' ? parsed.details.Subject : 'Hello from QR Studio!');
  const [body, setBody] = useState(parsed.type === 'email' ? parsed.details.Body : 'Check out this custom QR Toolkit.');

  useEffect(() => {
    const mailtoString = `mailto:${recipient}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    onChange(mailtoString);
  }, [recipient, subject, body, onChange]);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="email-recipient">Recipient Email</Label>
        <Input
          id="email-recipient"
          type="email"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="hello@domain.com"
        />
      </div>
      <div>
        <Label htmlFor="email-subject">Subject Line</Label>
        <Input
          id="email-subject"
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Enter subject"
        />
      </div>
      <div>
        <Label htmlFor="email-body">Email Body Message</Label>
        <textarea
          id="email-body"
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write email contents..."
          className="w-full px-4 py-2.5 text-sm rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-black/50 backdrop-blur-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all resize-none"
        />
      </div>
    </div>
  );
};

// 5. Phone Form
export const PhoneForm: React.FC<FormProps> = ({ initialText, onChange }) => {
  const parsed = parseQRData(initialText);
  const [phone, setPhone] = useState(parsed.type === 'phone' ? parsed.details.Phone : '+1234567890');

  useEffect(() => {
    onChange(`tel:${phone}`);
  }, [phone, onChange]);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="phone-input">Phone Number</Label>
        <Input
          id="phone-input"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 (555) 000-0000"
        />
      </div>
    </div>
  );
};

// 6. SMS Form
export const SmsForm: React.FC<FormProps> = ({ initialText, onChange }) => {
  const parsed = parseQRData(initialText);
  const [phone, setPhone] = useState(parsed.type === 'sms' ? parsed.details.Number : '+1234567890');
  const [message, setMessage] = useState(parsed.type === 'sms' ? parsed.details.Message : 'Scan my QR code!');

  useEffect(() => {
    onChange(`smsto:${phone}:${message}`);
  }, [phone, message, onChange]);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="sms-phone">Phone Number</Label>
        <Input
          id="sms-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 (555) 000-0000"
        />
      </div>
      <div>
        <Label htmlFor="sms-message">Message</Label>
        <textarea
          id="sms-message"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter text message..."
          className="w-full px-4 py-2.5 text-sm rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-black/50 backdrop-blur-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all resize-none"
        />
      </div>
    </div>
  );
};

// 7. Location Form
export const LocationForm: React.FC<FormProps> = ({ initialText, onChange }) => {
  const parsed = parseQRData(initialText);
  const [latitude, setLatitude] = useState(parsed.type === 'location' ? parsed.details.Latitude : '37.7749');
  const [longitude, setLongitude] = useState(parsed.type === 'location' ? parsed.details.Longitude : '-122.4194');

  useEffect(() => {
    onChange(`geo:${latitude},${longitude}`);
  }, [latitude, longitude, onChange]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="loc-latitude">Latitude</Label>
          <Input
            id="loc-latitude"
            type="number"
            step="any"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            placeholder="e.g. 37.7749"
          />
        </div>
        <div>
          <Label htmlFor="loc-longitude">Longitude</Label>
          <Input
            id="loc-longitude"
            type="number"
            step="any"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            placeholder="e.g. -122.4194"
          />
        </div>
      </div>
    </div>
  );
};

// 8. vCard Contact Form
export const VcardForm: React.FC<FormProps> = ({ initialText, onChange }) => {
  const parsed = parseQRData(initialText);

  // Extract names
  const getNames = () => {
    if (parsed.type !== 'vcard') return { first: 'Alex', last: 'Morgan' };
    const fullName = parsed.details.Name || 'Alex Morgan';
    const parts = fullName.split(' ');
    if (parts.length > 1) {
      return { first: parts[0], last: parts.slice(1).join(' ') };
    }
    return { first: fullName, last: '' };
  };

  const names = getNames();
  const [firstName, setFirstName] = useState(names.first);
  const [lastName, setLastName] = useState(names.last);
  const [company, setCompany] = useState(
    parsed.type === 'vcard' ? (parsed.details.Company === '(Not Specified)' ? '' : parsed.details.Company) : 'QR Studio Corp'
  );
  const [phone, setPhone] = useState(
    parsed.type === 'vcard' ? (parsed.details.Phone === '(None)' ? '' : parsed.details.Phone) : '+1 (555) 019-2834'
  );
  const [email, setEmail] = useState(
    parsed.type === 'vcard' ? (parsed.details.Email === '(None)' ? '' : parsed.details.Email) : 'alex@qrstudio.dev'
  );
  const [website, setWebsite] = useState(
    parsed.type === 'vcard' ? (parsed.details.Website === '(None)' ? '' : parsed.details.Website) : 'https://qrstudio.vercel.app'
  );

  useEffect(() => {
    const vcard = `BEGIN:VCARD\nVERSION:3.0\nN:${lastName};${firstName};;;\nFN:${firstName} ${lastName}\nORG:${company}\nTEL;TYPE=CELL:${phone}\nEMAIL;TYPE=PREF,INTERNET:${email}\nURL:${website}\nEND:VCARD`;
    onChange(vcard);
  }, [firstName, lastName, company, phone, email, website, onChange]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="vcard-first">First Name</Label>
          <Input
            id="vcard-first"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First Name"
          />
        </div>
        <div>
          <Label htmlFor="vcard-last">Last Name</Label>
          <Input
            id="vcard-last"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last Name"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="vcard-company">Company</Label>
        <Input
          id="vcard-company"
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Organization/Company Name"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="vcard-phone">Mobile Phone</Label>
          <Input
            id="vcard-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone Number"
          />
        </div>
        <div>
          <Label htmlFor="vcard-email">Email Address</Label>
          <Input
            id="vcard-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email Address"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="vcard-web">Website Link</Label>
        <Input
          id="vcard-web"
          type="url"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://example.com"
        />
      </div>
    </div>
  );
};

// 9. Calendar Event Form
export const CalendarForm: React.FC<FormProps> = ({ initialText, onChange }) => {
  const parsed = parseQRData(initialText);

  // UTC parser: YYYYMMDDTHHMMSSZ -> YYYY-MM-DDTHH:MM
  const parseDateTime = (str: string, fallback: string) => {
    if (!str || str.length < 15) return fallback;
    const y = str.substring(0, 4);
    const m = str.substring(4, 6);
    const d = str.substring(6, 8);
    const h = str.substring(9, 11);
    const min = str.substring(11, 13);
    return `${y}-${m}-${d}T${h}:${min}`;
  };

  const [title, setTitle] = useState(parsed.type === 'event' ? parsed.details.Title : 'Product Launch Keynote');
  const [description, setDescription] = useState(
    parsed.type === 'event' ? (parsed.details.Description === '(No Description)' ? '' : parsed.details.Description) : 'Unveiling QR Studio features.'
  );
  const [location, setLocation] = useState(
    parsed.type === 'event' ? (parsed.details.Location === '(No Location Specified)' ? '' : parsed.details.Location) : 'San Francisco, CA'
  );
  const [start, setStart] = useState(
    parsed.type === 'event' ? parseDateTime(parsed.details.Start, '2026-07-01T10:00') : '2026-07-01T10:00'
  );
  const [end, setEnd] = useState(
    parsed.type === 'event' ? parseDateTime(parsed.details.End, '2026-07-01T12:00') : '2026-07-01T12:00'
  );

  useEffect(() => {
    const formatDate = (datetime: string) => {
      if (!datetime) return '';
      const date = new Date(datetime);
      const y = date.getUTCFullYear();
      const m = String(date.getUTCMonth() + 1).padStart(2, '0');
      const d = String(date.getUTCDate()).padStart(2, '0');
      const h = String(date.getUTCHours()).padStart(2, '0');
      const min = String(date.getUTCMinutes()).padStart(2, '0');
      const s = '00';
      return `${y}${m}${d}T${h}${min}${s}Z`;
    };

    const startStr = formatDate(start);
    const endStr = formatDate(end);

    const event = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${title}\nDESCRIPTION:${description}\nLOCATION:${location}\nDTSTART:${startStr}\nDTEND:${endStr}\nEND:VEVENT\nEND:VCALENDAR`;
    onChange(event);
  }, [title, description, location, start, end, onChange]);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="cal-title">Event Title</Label>
        <Input
          id="cal-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Annual Design Review"
        />
      </div>
      <div>
        <Label htmlFor="cal-description">Event Description</Label>
        <textarea
          id="cal-description"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Details about the meeting..."
          className="w-full px-4 py-2.5 text-sm rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-black/50 backdrop-blur-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all resize-none"
        />
      </div>
      <div>
        <Label htmlFor="cal-location">Location</Label>
        <Input
          id="cal-location"
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Address or Meeting URL"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="cal-start">Start Date/Time</Label>
          <Input
            id="cal-start"
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="cal-end">End Date/Time</Label>
          <Input
            id="cal-end"
            type="datetime-local"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

// 10. Crypto Form
export const CryptoForm: React.FC<FormProps> = ({ initialText, onChange }) => {
  const parsed = parseQRData(initialText);
  const [network, setNetwork] = useState(parsed.type === 'crypto' ? parsed.details.Chain.toLowerCase() : 'ethereum');
  const [address, setAddress] = useState(parsed.type === 'crypto' ? parsed.details.Address : '0x71C7656EC7ab88b098defB751B7401B5f6d8976F');

  useEffect(() => {
    onChange(`${network}:${address}`);
  }, [network, address, onChange]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <Label htmlFor="crypto-network">Blockchain Network</Label>
          <Select
            id="crypto-network"
            value={network}
            onChange={(e) => setNetwork(e.target.value)}
            options={[
              { value: 'ethereum', label: 'Ethereum (ETH)' },
              { value: 'bitcoin', label: 'Bitcoin (BTC)' },
              { value: 'solana', label: 'Solana (SOL)' },
            ]}
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="crypto-address">Wallet Address</Label>
          <Input
            id="crypto-address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Paste wallet address"
          />
        </div>
      </div>
    </div>
  );
};

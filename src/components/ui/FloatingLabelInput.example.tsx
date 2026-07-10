import { Mail, User } from "lucide-react-native";
import React, { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";

import { FloatingLabelInput, FloatingLabelSelectOption } from "./FloatingLabelInput";

const COUNTRY_OPTIONS: FloatingLabelSelectOption[] = [
  { value: "PH", label: "Philippines" },
  { value: "US", label: "United States" },
  { value: "JP", label: "Japan" },
];

// Reference usage — every supported `type`, plus error/helper/icon states.
// Not part of the app's navigation; import into a screen to preview.
export function FloatingLabelInputExample() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("jane@example.com");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthDateValue, setBirthDateValue] = useState<Date>();
  const [meetingTime, setMeetingTime] = useState("");
  const [reminder, setReminder] = useState("");
  const [country, setCountry] = useState("PH");
  const selectedCountry = COUNTRY_OPTIONS.find((o) => o.value === country);

  return (
    <ScrollView contentContainerStyle={s.content}>
      <FloatingLabelInput
        label="Full Name"
        value={name}
        onChangeText={setName}
        leftIcon={<User size={18} color="#8B9097" />}
      />

      <FloatingLabelInput
        label="Email"
        type="email"
        value={email}
        onChangeText={setEmail}
        leftIcon={<Mail size={18} color="#8B9097" />}
        error={
          email && !email.includes("@") ? "Enter a valid email address" : undefined
        }
      />

      <FloatingLabelInput
        label="Password"
        type="password"
        value={password}
        onChangeText={setPassword}
        helperText="At least 8 characters"
      />

      <FloatingLabelInput
        label="Age"
        type="number"
        value={age}
        onChangeText={setAge}
      />

      <FloatingLabelInput
        label="Birth Date"
        type="date"
        value={birthDate}
        onChangeText={setBirthDate}
        pickerValue={birthDateValue}
        onChangeValue={setBirthDateValue}
        maximumDate={new Date()}
      />

      <FloatingLabelInput
        label="Meeting Time"
        type="time"
        value={meetingTime}
        onChangeText={setMeetingTime}
      />

      <FloatingLabelInput
        label="Reminder"
        type="datetime"
        value={reminder}
        onChangeText={setReminder}
      />

      <FloatingLabelInput
        label="Country"
        type="select"
        value={
          selectedCountry
            ? `${selectedCountry.value} — ${selectedCountry.label}`
            : ""
        }
        onChangeText={() => {}}
        options={COUNTRY_OPTIONS}
        onSelectOption={(opt) => setCountry(opt.value)}
      />

      <FloatingLabelInput
        label="Disabled Field"
        value="Read only"
        onChangeText={() => {}}
        disabled
      />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { padding: 16, gap: 16 },
});

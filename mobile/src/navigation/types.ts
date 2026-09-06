export type AuthStackParamList = {
  PhoneEntry: undefined;
  OtpVerify: { phone: string; demoOtp: string };
  ProfileSetup: { registrationToken: string };
};

export type MainTabParamList = {
  Map: undefined;
  Search: undefined;
  Chats: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  DonorDetail: { donorId: number };
  ChatThread: { chatId: number; otherUserName: string };
};

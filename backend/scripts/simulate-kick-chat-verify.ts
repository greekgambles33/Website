import { KickVerificationService } from "@/services/KickVerificationService";

const [, , kickUsername, code] = process.argv;

KickVerificationService.processVerification(kickUsername, code).then((result) => {
  console.log("VERIFIED:", result);
  process.exit(0);
});

import { Type } from "typebox";

const ErrorResponse = Type.Object({ code: Type.String() });
export default ErrorResponse;

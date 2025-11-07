import express from "express";
import {
  getAllContacts,
  replyContact,
  sendContactForm,
  updateContactStatus,
} from "../controllers/contactController.js";

const contactRouter = express.Router();

contactRouter.post("/send", sendContactForm);
contactRouter.get("/all", getAllContacts);
contactRouter.put("/update-status/:id", updateContactStatus);
contactRouter.post("/reply/:id", replyContact);
export default contactRouter;

import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import axiosInstance from "../utils/axiosInstance";
import * as XLSX from "xlsx";
import {
  TextField,
  Button,
  Grid,
  Alert,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

const AddDelivery = () => {
  const [serialNumber, setSerialNumber] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [items, setItems] = useState([]);
  const [successMessage, setSuccessMessage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [deliveryNumber, setDeliveryNumber] = useState("");
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  const columns = [
    { field: "serialNo", headerName: "Serial Number", flex: 1, minWidth: 150 },
    { field: "quantity", headerName: "Quantity", flex: 1, minWidth: 100 },
  ];

  const getUserInfo = async () => {
    try {
      const response = await axiosInstance.get("/get-user");
      if (response.data && response.data.user) {
        setUserInfo(response.data.user);
      }
    } catch (error) {
      if (error.response.status === 401) {
        localStorage.clear();
        navigate("/login");
      }
    }
  };

  useEffect(() => {
    getUserInfo();
  }, []);

  const handleAddItem = () => {
    if (!serialNumber) {
      alert("Please enter a Serial Number!");
      return;
    }
    if (quantity <= 0) {
      alert("Quantity must be greater than 0!");
      return;
    }

    const existingItemIndex = items.findIndex(
      (item) => item.serialNo === serialNumber
    );

    if (existingItemIndex !== -1) {
      const updatedItems = [...items];
      updatedItems[existingItemIndex].quantity += quantity;
      setItems(updatedItems);
    } else {
      setItems([...items, { serialNo: serialNumber, quantity }]);
    }

    setSerialNumber("");
    setQuantity(1);
    setSuccessMessage(true);
    setTimeout(() => setSuccessMessage(false), 3000);
  };

  const handleExcelUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      const extractedData = jsonData.map((row) => ({
        serialNo: row["Serial Number"],
        quantity: row["Quantity"] || 1,
      }));

      addExcelItems(extractedData);
    };
    reader.readAsArrayBuffer(file);
  };

  const addExcelItems = (data) => {
    const updatedItems = [...items];

    data.forEach(({ serialNo, quantity }) => {
      const existingItemIndex = updatedItems.findIndex(
        (item) => item.serialNo === serialNo
      );

      if (existingItemIndex !== -1) {
        updatedItems[existingItemIndex].quantity += quantity;
      } else {
        updatedItems.push({ serialNo, quantity });
      }
    });

    setItems(updatedItems);
  };

  const handleAddDelivery = () => {
    if (!deliveryNumber) {
      alert("Please enter a Delivery Number!");
      return;
    }

    const formattedItems = items.map((item) => ({
      serialNo: item.serialNo,
      quantity: item.quantity,
    }));

    setLoading(true);
    axiosInstance
      .post("/add-delivery", {
        deliveryNumber,
        deliveryDate: new Date(),
        items: formattedItems,
      })
      .then(() => {
        setSubmissionSuccess(true);
        setTimeout(() => setSubmissionSuccess(false), 3000);
        setSerialNumber("");
        setQuantity(1);
        setItems([]);
        setDeliveryNumber("");
      })
      .catch((error) => console.error("Error submitting delivery:", error))
      .finally(() => {
        setLoading(false);
        setOpenModal(false);
      });
  };

  return (
    <>
      <Navbar userInfo={userInfo} />

      {successMessage && (
        <Alert severity="success" sx={{ marginBottom: "20px" }}>
          Item successfully added to the list!
        </Alert>
      )}

      {submissionSuccess && (
        <Alert severity="success" sx={{ marginBottom: "20px" }}>
          Delivery submitted successfully!
        </Alert>
      )}

      <div style={{ padding: "30px" }}>
        <Grid container justifyContent="center" spacing={2}>
          <Grid item xs={3}>
            <TextField
              label="Serial Number"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={2}>
            <TextField
              label="Quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, e.target.value))}
              fullWidth
            />
          </Grid>
          <Grid item xs={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAddItem}
              disabled={loading}
            >
              {loading ? "Loading..." : "Add Item"}
            </Button>
          </Grid>
          <Grid item xs={3}>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleExcelUpload}
              style={{ marginTop: "10px" }}
            />
          </Grid>
        </Grid>

        <Box sx={{ height: 400, width: "100%", marginTop: 3 }}>
          <DataGrid
            rows={items}
            columns={columns}
            pageSize={5}
            disableSelectionOnClick
            getRowId={(row) => row.serialNo}
          />
        </Box>

        <Grid container justifyContent="center" style={{ marginTop: "30px" }}>
          <Grid item>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => setOpenModal(true)}
            >
              Add Delivery
            </Button>
          </Grid>
        </Grid>
      </div>

      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Confirm Delivery</DialogTitle>
        <DialogContent>
          <Typography variant="h6">
            Please enter the delivery number.
          </Typography>
          <TextField
            label="Delivery Number"
            fullWidth
            value={deliveryNumber}
            onChange={(e) => setDeliveryNumber(e.target.value)}
            style={{ marginBottom: "20px" }}
          />
          <Typography variant="body1">Items in this delivery:</Typography>
          <ul>
            {items.map((item, index) => (
              <li key={index}>
                Serial No: {item.serialNo} - Quantity: {item.quantity}
              </li>
            ))}
          </ul>
        </DialogContent>
        <DialogActions>
          <Button color="primary" onClick={handleAddDelivery}>
            {loading ? "Submitting..." : "Submit Delivery"}
          </Button>
          <Button onClick={() => setOpenModal(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AddDelivery;

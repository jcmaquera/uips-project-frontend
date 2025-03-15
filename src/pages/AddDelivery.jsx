import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import axiosInstance from "../utils/axiosInstance";
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
import * as XLSX from "xlsx"; // For Excel files
import Papa from "papaparse"; // For CSV files

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
    { field: "itemType", headerName: "Item Type", flex: 1, minWidth: 150 },
    {
      field: "itemDesc",
      headerName: "Item Description",
      flex: 2,
      minWidth: 200,
    },
    { field: "sizeSource", headerName: "Size/Source", flex: 1, minWidth: 150 },
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
    return () => {};
  }, []);

  const handleAddItem = async () => {
    if (!serialNumber) {
      alert("Please enter a Serial Number!");
      return;
    }

    if (quantity <= 0) {
      alert("Quantity must be greater than 0!");
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post("/get-item-by-serial", {
        serialNo: serialNumber,
      });

      if (response.data && response.data.item) {
        const newItem = {
          ...response.data.item,
          id: response.data.item._id,
          quantity: quantity,
        };

        const existingItemIndex = items.findIndex(
          (item) => item.serialNo === serialNumber
        );

        if (existingItemIndex !== -1) {
          const updatedItems = [...items];
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: updatedItems[existingItemIndex].quantity + quantity,
          };
          setItems(updatedItems);
        } else {
          setItems([...items, newItem]);
        }

        setSuccessMessage(true);
        setTimeout(() => setSuccessMessage(false), 3000);
      } else {
        alert("Item not found.");
      }
    } catch (error) {
      console.error("Error fetching item:", error);
      alert("Error fetching item. Please try again.");
    } finally {
      setLoading(false);
      setSerialNumber("");
      setQuantity(1);
    }
  };

  const handleFileUpload = (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const fileData = e.target.result;
      let parsedData = [];
      const fileExtension = file.name.split(".").pop().toLowerCase();

      try {
        if (fileExtension === "csv") {
          parsedData = Papa.parse(fileData, { header: true }).data;
        } else if (fileExtension === "xlsx" || fileExtension === "xls") {
          const wb = XLSX.read(fileData, { type: "binary" });
          const sheetName = wb.SheetNames[0]; // Get the first sheet
          const ws = wb.Sheets[sheetName];
          parsedData = XLSX.utils.sheet_to_json(ws);
        }

        if (parsedData.length > 0) {
          // Map over the parsed data and fetch item details for each entry
          for (let i = 0; i < parsedData.length; i++) {
            const { serialNo, quantity } = parsedData[i];
            const response = await axiosInstance.post("/get-item-by-serial", {
              serialNo,
            });

            if (response.data && response.data.item) {
              const newItem = {
                ...response.data.item,
                id: response.data.item._id,
                quantity: quantity,
              };

              const existingItemIndex = items.findIndex(
                (item) => item.serialNo === serialNo
              );

              if (existingItemIndex !== -1) {
                const updatedItems = [...items];
                updatedItems[existingItemIndex] = {
                  ...updatedItems[existingItemIndex],
                  quantity: updatedItems[existingItemIndex].quantity + quantity,
                };
                setItems(updatedItems);
              } else {
                setItems([...items, newItem]);
              }
            }
          }
        } else {
          alert("No valid data found in the file.");
        }
      } catch (error) {
        console.error("Error processing file:", error);
        alert("Error processing file. Please check the file format.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleAddDelivery = () => {
    if (!deliveryNumber) {
      alert("Please enter a Delivery Number!");
      return;
    }

    const formattedItems = items.map((item) => ({
      item: item._id,
      quantity: item.quantity,
    }));

    setLoading(true);
    axiosInstance
      .post("/add-delivery", {
        deliveryNumber,
        deliveryDate: new Date(),
        items: formattedItems,
      })
      .then((response) => {
        console.log("Delivery submitted successfully:", response.data);
        setSubmissionSuccess(true);
        setTimeout(() => setSubmissionSuccess(false), 3000);

        setSerialNumber("");
        setQuantity(1);
        setItems([]);
        setDeliveryNumber("");
      })
      .catch((error) => {
        console.error("Error submitting delivery:", error);
      })
      .finally(() => {
        setLoading(false);
        setOpenModal(false);
      });
  };

  return (
    <>
      <Navbar userInfo={userInfo} />

      {successMessage && (
        <Alert severity="success">Item successfully added!</Alert>
      )}
      {submissionSuccess && (
        <Alert severity="success">Delivery submitted successfully!</Alert>
      )}

      <div style={{ padding: "30px" }}>
        <Grid
          container
          justifyContent="center"
          style={{ marginBottom: "20px" }}
        >
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
        </Grid>

        {/* File Upload */}
        <Grid
          container
          justifyContent="center"
          style={{ marginBottom: "20px" }}
        >
          <Grid item xs={3}>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => handleFileUpload(e.target.files[0])}
              style={{ width: "100%" }}
            />
          </Grid>
        </Grid>

        <Box sx={{ height: 400, width: "100%" }}>
          <DataGrid rows={items} columns={columns} pageSize={5} />
        </Box>

        <Grid container justifyContent="center" style={{ marginTop: "30px" }}>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => setOpenModal(true)}
          >
            Add Delivery
          </Button>
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
            Please provide the delivery number and confirm the items.
          </Typography>
          <TextField
            label="Delivery Number"
            fullWidth
            value={deliveryNumber}
            onChange={(e) => setDeliveryNumber(e.target.value)}
          />
          <Typography variant="body1">Items in this delivery:</Typography>
          <ul>
            {items.map((item, index) => (
              <li key={index}>
                <strong>{item.itemType}</strong> - {item.itemDesc} -{" "}
                {item.sizeSource} - {item.serialNo} - {item.quantity} pcs
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

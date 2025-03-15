import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
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
  Input,
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

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const parsedData = XLSX.utils.sheet_to_json(sheet);

      const excelItems = parsedData.map((row) => ({
        serialNo: row["Serial Number"],
        quantity: row["Quantity"],
      }));

      for (const excelItem of excelItems) {
        await handleAddItemFromExcel(excelItem.serialNo, excelItem.quantity);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleAddItemFromExcel = async (serialNo, quantity) => {
    try {
      const response = await axiosInstance.post("/get-item-by-serial", {
        serialNo,
      });
      if (response.data && response.data.item) {
        const newItem = {
          ...response.data.item,
          id: response.data.item._id,
          quantity: quantity,
        };

        setItems((prevItems) => {
          const existingItemIndex = prevItems.findIndex(
            (item) => item.serialNo === serialNo
          );
          if (existingItemIndex !== -1) {
            const updatedItems = [...prevItems];
            updatedItems[existingItemIndex].quantity += quantity;
            return updatedItems;
          } else {
            return [...prevItems, newItem];
          }
        });
      }
    } catch (error) {
      console.error("Error fetching item:", error);
    }
  };

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

        setItems([...items, newItem]);
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

  return (
    <>
      <Navbar userInfo={userInfo} />
      <div style={{ padding: "30px" }}>
        <Grid
          container
          justifyContent="center"
          style={{ marginBottom: "20px" }}
        >
          <Input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
        </Grid>
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
        </Grid>
        <Box sx={{ height: 400, width: "100%" }}>
          <DataGrid
            rows={items}
            columns={columns}
            pageSize={5}
            disableSelectionOnClick
            getRowId={(row) => row.id}
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
    </>
  );
};

export default AddDelivery;

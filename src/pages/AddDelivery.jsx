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
import * as XLSX from "xlsx";

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
  const [openQuantityModal, setOpenQuantityModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [openSubmitModal, setOpenSubmitModal] = useState(false);

  const columns = [
    { field: "itemType", headerName: "Item Type", flex: 1, minWidth: 150 },
    { field: "itemDesc", headerName: "Item Description", flex: 2, minWidth: 200 },
    { field: "sizeSource", headerName: "Size/Source", flex: 1, minWidth: 150 },
    { field: "serialNo", headerName: "Serial Number", flex: 1, minWidth: 150 },
    { field: "quantity", headerName: "Quantity", flex: 1, minWidth: 100 },
  ];

  const handleSearchItem = async () => {
    if (!serialNumber) {
      alert("Please enter a Serial Number!");
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post("/get-item-by-serial", { serialNo: serialNumber });
      if (response.data && response.data.item) {
        setSelectedItem(response.data.item);
        setOpenQuantityModal(true);
      } else {
        alert("Item not found.");
      }
    } catch (error) {
      console.error("Error fetching item:", error);
      alert("Error fetching item. Please try again.");
    } finally {
      setLoading(false);
      setSerialNumber("");
    }
  };

  const handleAddItemWithQuantity = () => {
    if (!selectedItem || quantity <= 0) {
      alert("Please enter a valid quantity!");
      return;
    }

    const existingItemIndex = items.findIndex((item) => item.serialNo === selectedItem.serialNo);
    if (existingItemIndex !== -1) {
      const updatedItems = [...items];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: updatedItems[existingItemIndex].quantity + quantity,
      };
      setItems(updatedItems);
    } else {
      setItems([...items, { ...selectedItem, quantity }]);
    }

    setSuccessMessage(true);
    setTimeout(() => setSuccessMessage(false), 3000);
    setOpenQuantityModal(false);
    setQuantity(1);
  };

  const handleSubmitDelivery = async () => {
    if (items.length === 0) {
      alert("No items to submit!");
      return;
    }
    try {
      await axiosInstance.post("/submit-delivery", {
        deliveryNumber,
        items,
      });
      setSubmissionSuccess(true);
      setItems([]);
      setDeliveryNumber("");
      setOpenSubmitModal(false);
      alert("Delivery submitted successfully!");
    } catch (error) {
      console.error("Error submitting delivery:", error);
      alert("Error submitting delivery. Please try again.");
    }
  };

  return (
    <>
      <Navbar userInfo={userInfo} />

      {successMessage && (
        <Alert severity="success" sx={{ marginBottom: "20px" }}>
          Item successfully added to the list!
        </Alert>
      )}

      <div style={{ padding: "30px" }}>
        <Grid container justifyContent="center" spacing={2}>
          <Grid item xs={4}>
            <TextField
              label="Serial Number"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={2}>
            <Button variant="contained" color="primary" onClick={handleSearchItem} disabled={loading}>
              {loading ? "Loading..." : "Find Item"}
            </Button>
          </Grid>
        </Grid>

        <Box sx={{ height: 400, width: "100%", marginTop: "20px" }}>
          <DataGrid rows={items.map((item, index) => ({ ...item, id: item.serialNo || index }))} columns={columns} pageSize={5} />
        </Box>

        <Button variant="contained" color="secondary" onClick={() => setOpenSubmitModal(true)} sx={{ marginTop: "20px" }}>
          Submit Delivery
        </Button>
      </div>

      <Dialog open={openQuantityModal} onClose={() => setOpenQuantityModal(false)}>
        <DialogTitle>Enter Quantity</DialogTitle>
        <DialogContent>
          <Typography variant="body1">Adding: {selectedItem?.itemType} - {selectedItem?.itemDesc}</Typography>
          <TextField
            label="Quantity"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            fullWidth
            style={{ marginTop: "10px" }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddItemWithQuantity} color="primary">Add Item</Button>
          <Button onClick={() => setOpenQuantityModal(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openSubmitModal} onClose={() => setOpenSubmitModal(false)}>
        <DialogTitle>Confirm Delivery Submission</DialogTitle>
        <DialogContent>
          <Typography variant="body1">Are you sure you want to submit this delivery?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSubmitDelivery} color="primary">Submit</Button>
          <Button onClick={() => setOpenSubmitModal(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AddDelivery;

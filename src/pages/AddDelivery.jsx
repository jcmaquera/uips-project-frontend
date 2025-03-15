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
import * as XLSX from "xlsx"; // Import xlsx library

const AddDelivery = () => {
  const [serialNumber, setSerialNumber] = useState(""); // Serial number input state
  const [quantity, setQuantity] = useState(1); // Quantity input state
  const [items, setItems] = useState([]); // Items to be displayed in the table
  const [successMessage, setSuccessMessage] = useState(false); // Success message for adding items
  const [loading, setLoading] = useState(false); // Loading state
  const [openModal, setOpenModal] = useState(false); // Modal open state
  const [deliveryNumber, setDeliveryNumber] = useState(""); // Delivery Number input state
  const [submissionSuccess, setSubmissionSuccess] = useState(false); // Submission success state
  const [userInfo, setUserInfo] = useState(null);

  // Column definition for DataGrid
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
    { field: "quantity", headerName: "Quantity", flex: 1, minWidth: 100 }, // Add Quantity column
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
          id: response.data.item._id, // This is the _id from the Item document
          quantity: quantity,
        };

        const existingItemIndex = items.findIndex(
          (item) => item.serialNo === serialNumber
        );

        if (existingItemIndex !== -1) {
          // Update the quantity if the item already exists
          const updatedItems = [...items];
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: updatedItems[existingItemIndex].quantity + quantity,
          };
          setItems(updatedItems);
        } else {
          // Add the new item to the list
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

  const handleAddDelivery = () => {
    if (!deliveryNumber) {
      alert("Please enter a Delivery Number!");
      return;
    }

    // Prepare the items for delivery submission by ensuring each item has the correct item._id
    const formattedItems = items.map((item) => ({
      item: item._id, // Use _id from the item object
      quantity: item.quantity,
    }));

    // Log the formatted items
    console.log("Formatted Items before submitting delivery:", formattedItems);

    // Log the delivery number for debugging
    console.log("Delivery Number:", deliveryNumber);

    // Now submit the data to the backend (you can replace this with your actual API call)
    setLoading(true);
    axiosInstance
      .post("/add-delivery", {
        deliveryNumber: deliveryNumber,
        deliveryDate: new Date(),
        items: formattedItems,
      })
      .then((response) => {
        console.log("Delivery submitted successfully:", response.data);
        setSubmissionSuccess(true);
        setTimeout(() => setSubmissionSuccess(false), 3000); // Hide success message after 3 seconds

        // Reset the form fields and table
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
        setOpenModal(false); // Close the modal
      });
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleAddItem();
    }
  };

  // Function to handle file upload and parsing
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        // Assuming the first sheet contains the data
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const sheetData = XLSX.utils.sheet_to_json(sheet);

        // Clear existing items to avoid duplication
        const newItems = [...items];

        // Process the data from the sheet
        sheetData.forEach(async (row) => {
          const { serialNo, quantity } = row;

          if (serialNo && quantity > 0) {
            try {
              const response = await axiosInstance.post("/get-item-by-serial", {
                serialNo: serialNo,
              });

              if (response.data && response.data.item) {
                const newItem = {
                  ...response.data.item,
                  id: response.data.item._id, // This is the _id from the Item document
                  quantity: quantity,
                };

                const existingItemIndex = newItems.findIndex(
                  (item) => item.serialNo === serialNo
                );

                if (existingItemIndex !== -1) {
                  // Update the quantity if the item already exists
                  newItems[existingItemIndex] = {
                    ...newItems[existingItemIndex],
                    quantity: newItems[existingItemIndex].quantity + quantity,
                  };
                } else {
                  // Add the new item to the list
                  newItems.push(newItem);
                }

                setItems([...newItems]); // Update the state with new items
              } else {
                alert(`Item not found for serial number: ${serialNo}`);
              }
            } catch (error) {
              console.error("Error fetching item:", error);
            }
          }
        });
      };
      reader.readAsArrayBuffer(file);
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

      {submissionSuccess && (
        <Alert severity="success" sx={{ marginBottom: "20px" }}>
          Delivery submitted successfully!
        </Alert>
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
              onKeyDown={handleKeyDown}
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
              onKeyDown={handleKeyDown}
            />
          </Grid>
          <Grid item xs={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAddItem}
              style={{ height: "100%" }}
              disabled={loading}
            >
              {loading ? "Loading..." : "Add Item"}
            </Button>
          </Grid>
        </Grid>

        {/* Excel File Upload */}
        <Grid
          container
          justifyContent="center"
          style={{ marginBottom: "20px" }}
        >
          <Grid item xs={3}>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
              style={{ width: "100%" }}
            />
          </Grid>
        </Grid>

        {/* DataGrid to display added items */}
        <div style={{ height: 400, width: "100%" }}>
          <DataGrid
            rows={items}
            columns={columns}
            pageSize={5}
            rowsPerPageOptions={[5]}
            checkboxSelection
          />
        </div>

        {/* Delivery Modal */}
        <Dialog open={openModal} onClose={() => setOpenModal(false)}>
          <DialogTitle>Submit Delivery</DialogTitle>
          <DialogContent>
            <Typography variant="body1">Enter Delivery Number:</Typography>
            <TextField
              value={deliveryNumber}
              onChange={(e) => setDeliveryNumber(e.target.value)}
              fullWidth
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenModal(false)}>Cancel</Button>
            <Button onClick={handleAddDelivery}>Submit</Button>
          </DialogActions>
        </Dialog>
      </div>
    </>
  );
};

export default AddDelivery;

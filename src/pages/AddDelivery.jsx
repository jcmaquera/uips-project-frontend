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
import * as XLSX from "xlsx"; // Import XLSX library

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
        deliveryNumber: deliveryNumber,
        deliveryDate: new Date(),
        items: formattedItems,
      })
      .then((response) => {
        setSubmissionSuccess(true);
        setTimeout(() => setSubmissionSuccess(false), 3000); // Hide success message after 3 seconds

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

  const handleFileUpload = (file) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      const fileData = e.target.result;
      const fileExtension = file.name.split(".").pop().toLowerCase();

      if (fileExtension === "xlsx" || fileExtension === "xls") {
        try {
          const wb = XLSX.read(fileData, { type: "binary" });
          const sheetName = wb.SheetNames[0]; // Assuming the first sheet
          const ws = wb.Sheets[sheetName];
          const parsedData = XLSX.utils.sheet_to_json(ws);

          console.log("Parsed Data: ", parsedData); // Log the parsed data to inspect

          if (parsedData.length > 0) {
            for (let i = 0; i < parsedData.length; i++) {
              const row = parsedData[i];
              const serialNo = row.serialNo; // Ensure the column name matches
              const quantity = row.quantity; // Ensure the column name matches

              if (!serialNo || !quantity) {
                alert(`Missing serial number or quantity in row ${i + 1}`);
                continue;
              }

              const response = await axiosInstance.post("/get-item-by-serial", {
                serialNo,
              });

              if (
                response.status === 200 &&
                response.data &&
                response.data.item
              ) {
                const newItem = {
                  ...response.data.item,
                  serialNo: serialNo, // Use serialNo as the unique identifier
                  quantity: quantity,
                };

                const existingItemIndex = items.findIndex(
                  (item) => item.serialNo === serialNo
                );

                if (existingItemIndex === -1) {
                  // If the item doesn't exist, add it to the table
                  setItems((prevItems) => [...prevItems, newItem]);
                } else {
                  // If the item exists, update the quantity
                  const updatedItems = [...items];
                  updatedItems[existingItemIndex] = {
                    ...updatedItems[existingItemIndex],
                    quantity:
                      updatedItems[existingItemIndex].quantity + quantity,
                  };
                  setItems(updatedItems);
                }
              } else {
                alert(`Item not found for serial number: ${serialNo}`);
              }
            }
          } else {
            alert("No valid data found in the file.");
          }
        } catch (error) {
          console.error("Error processing file:", error);
          alert("Error processing file. Please check the file format.");
        }
      } else {
        alert("Invalid file format. Please upload an XLSX file.");
      }
    };

    reader.readAsBinaryString(file);
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

        <Box sx={{ height: 400, width: "100%" }}>
          <DataGrid
            rows={items.map((item, index) => ({
              ...item,
              id: item.serialNo || index,
            }))} // Ensure a unique ID
            columns={columns}
            pageSize={5}
            disableSelectionOnClick
            getRowId={(row) => row.id} // Use the custom id field
          />
        </Box>

        {/* File Upload Button */}
        <Grid container justifyContent="center" style={{ marginTop: "20px" }}>
          <Grid item xs={3}>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={(e) => handleFileUpload(e.target.files[0])}
            />
          </Grid>
        </Grid>

        {/* Add Delivery Button */}
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

      {/* Modal for Delivery Confirmation */}
      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Confirm Delivery</DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>
            Please provide the delivery number and confirm the items.
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

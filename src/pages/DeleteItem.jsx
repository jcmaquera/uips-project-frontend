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
import { useNavigate } from "react-router-dom"; // Import navigate

const Checkout = () => {
  const [serialNumber, setSerialNumber] = useState(""); // Serial number input state
  const [quantity, setQuantity] = useState(1); // Quantity input state
  const [items, setItems] = useState([]); // Items to be displayed in the table
  const [successMessage, setSuccessMessage] = useState(false); // Success message for adding items
  const [loading, setLoading] = useState(false); // Loading state
  const [openModal, setOpenModal] = useState(false); // Modal open state
  const [checkoutNumber, setCheckoutNumber] = useState(""); // Checkout Number input state
  const [submissionSuccess, setSubmissionSuccess] = useState(false); // Submission success state
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate(); // Initialize navigate

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
    { field: "quantity", headerName: "Quantity", flex: 1, minWidth: 100 },
  ];

  const getUserInfo = async () => {
    try {
      const response = await axiosInstance.get("/get-user");
      if (response.data && response.data.user) {
        setUserInfo(response.data.user);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.clear();
        navigate("/login");
      }
      console.error("Error fetching user info:", error);
    }
  };

  useEffect(() => {
    getUserInfo();
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

  const handleCheckout = () => {
    if (!checkoutNumber) {
      alert("Please enter a Checkout Number!");
      return;
    }

    // Prepare the items for checkout submission
    const formattedItems = items.map((item) => ({
      item: item._id, // Ensure this is the correct field on the backend
      quantity: item.quantity,
    }));

    // Log the formatted items for debugging
    console.log("Formatted Items before submitting checkout:", formattedItems);

    // Log the checkout number for debugging
    console.log("Checkout Number:", checkoutNumber);

    // Now submit the data to the backend (you can replace this with your actual API call)
    setLoading(true);
    axiosInstance
      .post("/checkout", {
        checkoutNumber: checkoutNumber,
        checkoutDate: new Date(),
        items: formattedItems,
      })
      .then((response) => {
        console.log("Checkout submitted successfully:", response.data);
        setSubmissionSuccess(true);
        setTimeout(() => setSubmissionSuccess(false), 3000); // Hide success message after 3 seconds

        // Reset the form fields and table
        setSerialNumber("");
        setQuantity(1);
        setItems([]);
        setCheckoutNumber("");
      })
      .catch((error) => {
        console.error(
          "Error submitting checkout:",
          error.response?.data || error.message
        );
        alert("There was an issue submitting the checkout. Please try again.");
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
          Checkout submitted successfully!
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
              onChange={(e) =>
                setQuantity(Math.max(1, parseInt(e.target.value)))
              }
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
            rows={items}
            columns={columns}
            pageSize={5}
            disableSelectionOnClick
            getRowId={(row) => row.id}
          />
        </Box>

        {/* Checkout Button */}
        <Grid container justifyContent="center" style={{ marginTop: "30px" }}>
          <Grid item>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => setOpenModal(true)}
            >
              Proceed to Checkout
            </Button>
          </Grid>
        </Grid>
      </div>

      {/* Modal for Checkout Confirmation */}
      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Confirm Checkout</DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>
            Please provide the checkout number and confirm the items.
          </Typography>
          <TextField
            label="Checkout Number"
            fullWidth
            value={checkoutNumber}
            onChange={(e) => setCheckoutNumber(e.target.value)}
            style={{ marginBottom: "20px" }}
          />
          <Typography variant="body1">Items in this checkout:</Typography>
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
          <Button color="primary" onClick={handleCheckout}>
            {loading ? "Submitting..." : "Submit Checkout"}
          </Button>
          <Button onClick={() => setOpenModal(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Checkout;

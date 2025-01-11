import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

const FeedbackButton = () => {
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const handleSubmit = (event) => {
    event.preventDefault();
    // Handle form submission logic here
    handleClose();
  };

  return (
    <>
      <Button className="feedback-button" onClick={handleShow}>
        Feedback
      </Button>

      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Feedback</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="feedbackForm.ControlTextarea">
              <Form.Label>Your Feedback</Form.Label>
              <Form.Control as="textarea" rows={3} required />
            </Form.Group>
            <Button variant="primary" type="submit">
              Submit
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default FeedbackButton;

import React, { useState } from 'react'; // 1. Import useState
// --- ADD Button TO THE IMPORT ---
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom'; // We use Link for navigation
import { FaQrcode } from 'react-icons/fa';

function NavigationBar() {
  // 2. Create a state variable to track if the menu is expanded
  const [expanded, setExpanded] = useState(false);

  return (
    <Navbar 
      bg="dark" 
      variant="dark" 
      expand="lg" 
      sticky="top"
      expanded={expanded} // 3. Control the Navbar's expanded state with our variable
    >
      <Container>
        {/* 4. Add onClick to the brand to close the menu */}
        <Navbar.Brand as={Link} to="/" onClick={() => setExpanded(false)}>
          TMS
        </Navbar.Brand>
        
        {/* 5. Make the toggle update our state variable */}
        <Navbar.Toggle 
          aria-controls="basic-navbar-nav" 
          onClick={() => setExpanded(expanded ? false : true)} // Toggles the state
          aria-expanded={expanded}
        />
        
        <Navbar.Collapse id="basic-navbar-nav">
          
          {/* Main navigation links on the left */}
          <Nav className="me-auto">
            {/* 6. Add onClick={() => setExpanded(false)} to EVERY link */}
            <Nav.Link as={Link} to="/" onClick={() => setExpanded(false)}>Dashboard</Nav.Link>
            <Nav.Link as={Link} to="/students" onClick={() => setExpanded(false)}>Students</Nav.Link>
            <Nav.Link as={Link} to="/payments" onClick={() => setExpanded(false)}>Payments</Nav.Link>
            <Nav.Link as={Link} to="/attendance" onClick={() => setExpanded(false)}>Attendance</Nav.Link>
            <Nav.Link as={Link} to="/finance-report" onClick={() => setExpanded(false)}>Finance Report</Nav.Link>
            <Nav.Link as={Link} to="/settings" onClick={() => setExpanded(false)}>Settings</Nav.Link>
          </Nav>

          {/* This separate Nav component pushes itself to the far right */}
          <Nav className="ms-auto">
            {/* 6. Also add onClick to this link */}
            <Nav.Link as={Link} to="/scan" onClick={() => setExpanded(false)}>
              <Button variant="success">
                <FaQrcode className="me-2" /> Scan & Check-in
              </Button>
            </Nav.Link>
          </Nav>

        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavigationBar;
### Backend ###
# terraform {
#   backend "azurerm" {}
# }

### Providers ###
provider "azurerm" {
  features {}
}

## Data: recover bitmovin-azure-connect
data "azuread_service_principal" "bitmovin_azure_connect" {
  application_id = "ad59b58a-9910-409a-909e-cf98258bb566" 
}

### Resources ###

# Resource group
resource "azurerm_resource_group" "rg" {
  name     = "bitmovin-on-azure"
  location = var.location
}

# Azure Network Security Group
resource "azurerm_network_security_group" "nsg" {
  name                = "bitmovin-nsg"
  location            = var.location
  resource_group_name = azurerm_resource_group.rg.name



  #Allow Encoder Service Inbound
  security_rule {
    name                       = "AllowEncoderServiceInbound"
    description                = "For communication with the service that manages the encoding"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "TCP"
    source_port_range          = "*"
    destination_port_range     = "9999"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  #Allow Session Manager Inbound
  security_rule {
    name                       = "AllowSessionManagerInbound"
    description                = "For communication with the service that manages the encoding instances"
    priority                   = 200
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "TCP"
    source_port_range          = "*"
    destination_port_range     = "9090"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  #Allow SSH
  security_rule {
    name                       = "AllowSSH"
    description                = "For incoming commands (i.e. pulling and starting docker containers)"
    priority                   = 1000
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "TCP"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  #Inbound security rules that are necessary to run RTMP live streams

  #RTMP Listener
  security_rule {
    name                       = "rtmp-listener"
    description                = "For RTMP live streams"
    priority                   = 300
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "TCP"
    source_port_range          = "*"
    destination_port_range     = "1935"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  #Inbound security rules that are necessary to run SRT live streams

  #For SRT live streams
  security_rule {
    name                       = "srt-listener-TCP"
    description                = "For SRT live streams"
    priority                   = 400
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "TCP"
    source_port_range          = "*"
    destination_port_range     = "2088"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  #For SRT live streams
  security_rule {
    name                       = "srt-listener-udp-2088"
    description                = "For SRT live streams"
    priority                   = 500
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "UDP"
    source_port_range          = "*"
    destination_port_range     = "2088"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  #For SRT live streams
  security_rule {
    name                       = "srt-listener-udp-2090"
    description                = "For SRT live streams"
    priority                   = 700
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "UDP"
    source_port_range          = "*"
    destination_port_range     = "2090"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  #For SRT live streams
  security_rule {
    name                       = "srt-listener-udp-2091"
    description                = "For SRT live streams"
    priority                   = 800
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "UDP"
    source_port_range          = "*"
    destination_port_range     = "2091"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  #Inbound security rules that are necessary to run Zixi live streams
  #For SRT live streams
  security_rule {
    name                       = "zixi-listener"
    description                = "For Zixi live streams"
    priority                   = 900
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "TCP"
    source_port_range          = "*"
    destination_port_range     = "4444"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

}

# Azure Virtual Network
resource "azurerm_virtual_network" "vnet" {
  name                = "bitmovin-vnet"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  address_space       = ["10.0.0.0/16"]

  subnet {
    name           = "encoders-subnet"
    address_prefix = "10.0.0.0/16"
    security_group = azurerm_network_security_group.nsg.id
  }
}

# Give the bitmovin-azure-connect Application rights to run virtual machines on your subscription
resource "azurerm_role_assignment" "assignment" {
  scope                = azurerm_resource_group.rg.id
  role_definition_name = "Contributor"
  principal_id         = data.azuread_service_principal.bitmovin_azure_connect.object_id
}

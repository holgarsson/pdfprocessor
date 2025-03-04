﻿using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using System.Reflection;

namespace PdfProcessor.API.Services.LLMIntegration.Models;

public class FinancialData
{
	#region Company Info

    [Display(Name = "Company ID", GroupName = "Company Info")]
    public decimal? CompanyId { get; set; }

    [Display(Name = "Company Name", GroupName = "Company Info")]
    public string? CompanyName { get; set; }

	#endregion

    #region Income Statement

    [Display(Name = "Gross Profit", GroupName = "Income Statement")]
    public decimal? GrossProfit { get; set; }
    
    [Display(Name = "Staff Costs", GroupName = "Income Statement")]
    public decimal? StaffCosts { get; set; }
    
    [Display(Name = "Other Operating Expenses", GroupName = "Income Statement")]
    public decimal? OtherOperatingExpenses { get; set; }
    
    [Display(Name = "Depreciation", GroupName = "Income Statement")]
    public decimal? Depreciation { get; set; }
    
    [Display(Name = "Profit Before Interest", GroupName = "Income Statement")]
    public decimal? ProfitBeforeInterest { get; set; }
    
    [Display(Name = "Financial Income", GroupName = "Income Statement")]
    public decimal? FinancialIncome { get; set; }
    
    [Display(Name = "Financial Expenses", GroupName = "Income Statement")]
    public decimal? FinancialExpenses { get; set; }
    
    [Display(Name = "Profit Before Extraordinary Items", GroupName = "Income Statement")]
    public decimal? ProfitBeforeExtraordinaryItems { get; set; }
    
    [Display(Name = "Extraordinary Items", GroupName = "Income Statement")]
    public decimal? ExtraordinaryItems { get; set; }
    
    [Display(Name = "Profit Before Tax", GroupName = "Income Statement")]
    public decimal? ProfitBeforeTax { get; set; }
    
    [Display(Name = "Tax", GroupName = "Income Statement")]
    public decimal? Tax { get; set; }
    
    [Display(Name = "Profit After Tax", GroupName = "Income Statement")]
    public decimal? ProfitAfterTax { get; set; }
    
    [Display(Name = "Annual Result", GroupName = "Income Statement")]
    public decimal? AnnualResult { get; set; }

    #endregion

    #region Balance Sheet - Assets
    
    [Display(Name = "Fixed Assets", GroupName = "Balance Sheet - Assets")]
    public decimal? FixedAssets { get; set; }
    
    [Display(Name = "Current Assets", GroupName = "Balance Sheet - Assets")]
    public decimal? CurrentAssets { get; set; }
    
    [Display(Name = "Total Assets", GroupName = "Balance Sheet - Assets")]
    public decimal? TotalAssets { get; set; }

    #endregion

    #region Balance Sheet - Equity and Liabilities
    
    [Display(Name = "Equity", GroupName = "Balance Sheet - Equity and Liabilities")]
    public decimal? Equity { get; set; }
    
    [Display(Name = "Provisions", GroupName = "Balance Sheet - Equity and Liabilities")]
    public decimal? Provisions { get; set; }
    
    [Display(Name = "Long Term Liabilities", GroupName = "Balance Sheet - Equity and Liabilities")]
    public decimal? LongTermLiabilities { get; set; }
    
    [Display(Name = "Short Term Liabilities", GroupName = "Balance Sheet - Equity and Liabilities")]
    public decimal? ShortTermLiabilities { get; set; }
    
    [Display(Name = "Total Liabilities", GroupName = "Balance Sheet - Equity and Liabilities")]
    public decimal? TotalLiabilities { get; set; }
    
    [Display(Name = "Equity and Liabilities", GroupName = "Balance Sheet - Equity and Liabilities")]
    public decimal? EquityAndLiabilities { get; set; }

    #endregion

    /// <summary>
    /// Returns a JSON representation of the financial data
    /// </summary>
    public override string ToString() => JsonSerializer.Serialize(this);
    

    /// <summary>
    /// Creates a FinancialData object from a JSON string
    /// </summary>
    public static FinancialData FromJson(string jsonString)
    {
        // Take until starts with "{" and ends with "}"
        int startIndex = jsonString.IndexOf('{');
        int endIndex = jsonString.LastIndexOf('}') + 1;
        jsonString = jsonString[startIndex..endIndex];

        JsonDocument jsonDocument = JsonDocument.Parse(jsonString);
        Console.WriteLine(jsonDocument.RootElement.EnumerateObject().Select(p => $"{p.Name}: {p.Value.ValueKind}").Aggregate((a, b) => $"{a}, {b}"));
        FinancialData data = new();

        foreach (JsonProperty property in jsonDocument.RootElement.EnumerateObject())
        {
            PropertyInfo? propertyInfo = typeof(FinancialData).GetProperty(property.Name, BindingFlags.IgnoreCase | BindingFlags.Public | BindingFlags.Instance);
            if (propertyInfo == null) continue;

            try
            {
                if (property.Value.ValueKind == JsonValueKind.Number)
                {
                    decimal decimalValue = property.Value.GetDecimal();
                    propertyInfo.SetValue(data, decimalValue);
                }
                else if (property.Value.ValueKind == JsonValueKind.String)
                {
                    string? value = property.Value.GetString();

                    if (property.Name == "companyName")
                    {
                        propertyInfo.SetValue(data, value);
                        continue;
                    }

                    if (property.Name == nameof(CompanyId))
                    {
                        // Remove all non-numeric characters
                        string? companyNumberString = new(value?.Where(char.IsDigit).ToArray());
                        if (!string.IsNullOrEmpty(companyNumberString) && int.TryParse(companyNumberString.Trim(), out int companyNumber))
                        {
                            propertyInfo.SetValue(data, companyNumber);
                            continue;
                        }
                    }

                    if (decimal.TryParse(value?.Replace(".", ""), out decimal decimalValue))
                    {
                        propertyInfo.SetValue(data, decimalValue);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error setting property {property.Name}: {ex.Message}");
            }
        }

        return data;
    }

    /// <summary>
    /// Gets a human-readable display name for a property
    /// </summary>
    public static string GetDisplayName(string propertyName)
    {
        PropertyInfo? property = typeof(FinancialData).GetProperty(propertyName);
        if (property == null) return propertyName;

        DisplayAttribute? displayAttribute = property.GetCustomAttribute<DisplayAttribute>();
        return displayAttribute?.Name ?? propertyName;
    }

    /// <summary>
    /// Gets the group name for a property
    /// </summary>
    public static string GetGroupName(string propertyName)
    {
        PropertyInfo? property = typeof(FinancialData).GetProperty(propertyName);
        if (property == null) return string.Empty;

        DisplayAttribute? displayAttribute = property.GetCustomAttribute<DisplayAttribute>();
        return displayAttribute?.GroupName ?? string.Empty;
    }
}
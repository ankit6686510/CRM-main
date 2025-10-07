import React, { useState } from "react";
import { useForm } from "react-hook-form";
import axiosInstance from "../../utils/axios";
import { useApi } from "../../context/ApiContext";
import { toast } from "react-hot-toast";
import ReactQueryBuilder from "react-querybuilder";
import "react-querybuilder/dist/query-builder.css";
import { useNavigate } from "react-router-dom";
import { BsStars as FiSparkles } from "react-icons/bs";
import { FiUsers, FiMail, FiTarget, FiBarChart2 } from "react-icons/fi";
import Modal from "../dashboard/Modal";
import LoadingSpinner from "../common/LoadingSpinner";

const CampaignCreatePage = () => {
  const { CustomValueEditor } = useApi();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    getValues,
  } = useForm();
  const [segmentQuery, setSegmentQuery] = useState({
    combinator: "and",
    rules: [],
  });
  const [estimatedCount, setEstimatedCount] = useState(0);
  const [isEstimating, setIsEstimating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Gemini Ai
  const [isGenerating, setIsGenerating] = useState(false);

  const [previewData, setPreviewData] = useState(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const handleGenerateContent = async () => {
    try {
      // Validate segment rules
      if (!segmentQuery.rules || segmentQuery.rules.length === 0) {
        toast.error("Please define segment rules first");
        return;
      }

      setIsGenerating(true);
      
      // Get current form values using react-hook-form
      const formValues = getValues();
      const campaignName = formValues.campaignName || '';
      const segmentDescription = formValues.segmentDescription || '';

      console.log("🎯 Sending to AI:", { campaignName, segmentDescription });

      const { data } = await axiosInstance.post(
        "/ai/generate-campaign-content",
        {
          segmentRules: segmentQuery,
          campaignName: campaignName,
          segmentDescription: segmentDescription,
        }
      );

      if (!data.data) {
        throw new Error("No content generated");
      }

      // Split into subject and body (assuming response is separated by \n\n)
      const [subjectLine, ...bodyParts] = data.data.split("\n\n");
      const body = bodyParts.join("\n\n");

      // Validate the response format
      if (!subjectLine.startsWith("Subject:") || !body) {
        throw new Error("Invalid content format from AI");
      }

      // Extract subject and clean it up
      const subject = subjectLine.replace("Subject:", "").trim();

      // Validate subject length
      if (subject.length > 60) {
        toast.warning(
          "Generated subject line is longer than recommended (60 characters)"
        );
      }

      // Validate personalization variables
      if (!body.includes("{") || !body.includes("}")) {
        toast.warning(
          "Generated content might be missing personalization variables"
        );
      }

      // Update form fields using setValue
      setValue("subject", subject);
      setValue("message", body);

      toast.success("AI-generated content created!");
    } catch (error) {
      console.error("Content Generation Error:", error);

      // Handle specific error cases
      if (error.response?.status === 429) {
        if (error.response?.data?.error === "QUOTA_EXCEEDED") {
          toast.error(
            "AI service quota exceeded. Please try again later or contact support.",
            { duration: 5000 }
          );
        } else {
          toast.error(
            "AI service is currently busy. Please try again in a few minutes.",
            { duration: 5000 }
          );
        }
      } else if (error.response?.status === 401) {
        toast.error(
          "AI service authentication failed. Please check your API key.",
          { duration: 5000 }
        );
      } else if (error.message.includes("Invalid content format")) {
        toast.error(
          "AI generated content is not in the correct format. Please try again.",
          { duration: 5000 }
        );
      } else {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Failed to generate content";
        toast.error(errorMessage);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const estimateAudience = async () => {
    try {
      // Validate segment rules
      if (!segmentQuery.rules || segmentQuery.rules.length === 0) {
        toast.error("Please add at least one segment rule first");
        return;
      }

      setIsEstimating(true);
      const response = await axiosInstance.post("/user/estimate-segment", {
        rules: segmentQuery,
      });

      if (response.data.success) {
        setEstimatedCount(response.data.data.count);
        toast.success(
          `Estimated audience: ${response.data.data.count} customers`
        );
      } else {
        throw new Error(response.data.message || "Failed to estimate audience");
      }
    } catch (error) {
      console.error("Estimation Error:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to estimate audience"
      );
      setEstimatedCount(0);
    } finally {
      setIsEstimating(false);
    }
  };

  const getDetailedPreview = async () => {
    try {
      setIsPreviewLoading(true);
      const response = await axiosInstance.post("/user/preview-segment", {
        rules: segmentQuery,
      });
      setPreviewData(response.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to get preview");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const onSubmit = async (data) => {
    // Validate required fields
    if (!data.campaignName) {
      toast.error("Please enter a campaign name");
      return;
    }

    if (!data.subject) {
      toast.error("Please enter a subject line");
      return;
    }

    if (!data.message) {
      toast.error("Please enter a message body");
      return;
    }

    if (!data.message.includes("{") || !data.message.includes("}")) {
      toast.error(
        "Message must include at least one personalization variable like {name}"
      );
      return;
    }

    // Check if segment rules are defined
    if (!segmentQuery.rules || segmentQuery.rules.length === 0) {
      toast.error("Please add at least one segment rule");
      return;
    }

    // Check if audience has been estimated
    if (estimatedCount === 0) {
      toast.error(
        "Please estimate audience size first by clicking 'Estimate Size'"
      );
      return;
    }

    try {
      setIsSubmitting(true);
      // Format the rules properly before sending
      const formattedRules = {
        combinator: segmentQuery.combinator,
        rules: segmentQuery.rules.map((rule) => ({
          field: rule.field,
          operator: rule.operator,
          value: rule.value,
        })),
      };

      const segmentRes = await axiosInstance.post("/user/create-segment", {
        name: `Segment for ${data.campaignName}`,
        description: data.segmentDescription,
        rules: formattedRules,
      });

      await axiosInstance.post("/user/create-campaign", {
        name: data.campaignName,
        segmentId: segmentRes.data.data._id,
        template: {
          subject: data.subject,
          body: data.message,
          variables: extractVariables(data.message),
        },
      });

      toast.success("Campaign created successfully!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Campaign Creation Error:", error);
      toast.error(error.response?.data?.message || "Failed to create campaign");
    } finally {
      setIsSubmitting(false);
    }
  };

  const extractVariables = (message) => {
    const regex = /\{([^}]+)\}/g;
    const matches = [];
    let match;
    while ((match = regex.exec(message)) !== null) {
      matches.push(match[1]);
    }
    return [...new Set(matches)];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
                Create Campaign
              </h1>
              <p className="text-gray-600 text-lg">
                Design your perfect marketing campaign
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="px-6 py-3 border-2 border-indigo-200 bg-white text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all duration-300 hover:shadow-md font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Campaign Details Section */}
          <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-indigo-100 p-8 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-500 p-3 rounded-2xl">
                <FiMail className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Campaign Details
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Name 
                </label>
                <input
                  {...register("campaignName", {
                    required: "Campaign name is required",
                  })}
                  className="w-full px-4 py-3 border-2 border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/50 hover:bg-white transition-colors"
                  placeholder="Enter campaign name"
                />
                {errors.campaignName && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.campaignName.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Segment Description
                </label>
                <input
                  {...register("segmentDescription")}
                  className="w-full px-4 py-3 border-2 border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/50 hover:bg-white transition-colors"
                  placeholder="Add description"
                />
              </div>
            </div>
          </div>

          {/* Audience Segmentation Section */}
          <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-indigo-100 p-8 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-500 p-3 rounded-2xl">
                <FiTarget className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Audience Segmentation
              </h2>
            </div>
            <div className="flex justify-end gap-4 mb-8">
              <button
                type="button"
                onClick={estimateAudience}
                disabled={isEstimating || segmentQuery.rules.length === 0}
                className={`px-6 py-3 rounded-xl text-white transition-all duration-300 font-medium ${
                  isEstimating || segmentQuery.rules.length === 0
                    ? "bg-indigo-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg"
                }`}
              >
                {isEstimating ? "Estimating..." : "Estimate Size"}
              </button>
              <button
                type="button"
                onClick={getDetailedPreview}
                disabled={isPreviewLoading || segmentQuery.rules.length === 0}
                className={`px-6 py-3 rounded-xl text-white transition-all duration-300 font-medium ${
                  isPreviewLoading || segmentQuery.rules.length === 0
                    ? "bg-indigo-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg"
                }`}
              >
                {isPreviewLoading ? "Loading..." : "Detailed Preview"}
              </button>
            </div>

            <div className="bg-white/50 rounded-2xl border-2 border-indigo-100 p-6">
              <ReactQueryBuilder
                fields={[
                  {
                    name: "total_spent",
                    label: "Total Spent",
                    valueEditorType: "number",
                    inputType: "number",
                  },
                  {
                    name: "order_count",
                    label: "Order Count",
                    valueEditorType: "number",
                    inputType: "number",
                  },
                  {
                    name: "last_purchase",
                    label: "Last Purchase (days ago)",
                    valueEditorType: "number",
                    inputType: "number",
                  },
                  {
                    name: "city",
                    label: "City",
                    valueEditorType: "text",
                  },
                  {
                    name: "country",
                    label: "Country",
                    valueEditorType: "text",
                  },
                  {
                    name: "is_active",
                    label: "Is Active",
                    valueEditorType: "select",
                    values: [
                      { name: "true", label: "Yes" },
                      { name: "false", label: "No" },
                    ],
                  },
                ]}
                operators={[
                  { name: ">", label: ">" },
                  { name: "<", label: "<" },
                  { name: "==", label: "=" },
                  { name: ">=", label: ">=" },
                  { name: "<=", label: "<=" },
                  { name: "!=", label: "!=" },
                  { name: "contains", label: "contains" },
                ]}
                controlElements={{ valueEditor: CustomValueEditor }}
                query={segmentQuery}
                onQueryChange={(q) => setSegmentQuery(q)}
              />
            </div>

            {estimatedCount > 0 && (
              <div className="mt-8 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-100 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-500 p-3 rounded-xl">
                    <FiUsers className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <span className="text-gray-600 text-lg">
                      Estimated audience size:
                    </span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent ml-2">
                      {estimatedCount} customers
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Message Section */}
          <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-indigo-100 p-8 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-500 p-3 rounded-2xl">
                <FiMail className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Campaign Message
              </h2>
              <button
                onClick={handleGenerateContent}
                disabled={isGenerating || segmentQuery.rules.length === 0}
                className="ml-auto flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 disabled:bg-indigo-300 disabled:cursor-not-allowed hover:shadow-md font-medium"
              >
                <FiSparkles size={14} />
                {isGenerating ? "Generating..." : "Generate using AI"}
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  {...register("subject", { required: "Subject is required" })}
                  className="w-full px-4 py-3 border-2 border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/50 hover:bg-white transition-colors"
                  placeholder="Please enter the subject line"
                />
                {errors.subject && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.subject.message}
                  </p>
                )}
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message Body
                  
                </label>
                <textarea
                  {...register("message", {
                    required: "Message is required",
                    validate: {
                      hasVariables: (value) =>
                        /\{.+?\}/.test(value) ||
                        "",
                    },
                  })}
                  rows={6}
                  className="w-full px-4 py-3 border-2 border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/50 hover:bg-white transition-colors"
                  placeholder="Enter the message body"
                />
                {errors.message && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.message.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-8 py-4 rounded-xl text-white transition-all duration-300 font-medium text-lg ${
                isSubmitting
                  ? "bg-indigo-300 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg"
              }`}
            >
              {isSubmitting ? "Creating Campaign..." : "Create Campaign"}
            </button>
          </div>
        </form>

        {/* Detailed Preview Modal */}
        <Modal
          isOpen={!!previewData}
          onClose={() => setPreviewData(null)}
          title="Segment Preview"
          size="xl"
          blurBackground={false}
        >
          {isPreviewLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            previewData && (
              <div className="space-y-8">
                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-8 rounded-2xl border-2 border-indigo-100">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="bg-gradient-to-br from-indigo-500 to-purple-500 p-3 rounded-xl">
                        <FiUsers className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">
                        Total Customers
                      </h3>
                    </div>
                    <p className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      {previewData.totalCount}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-2xl border-2 border-green-100">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-3 rounded-xl">
                        <FiBarChart2 className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">
                        Active Customers
                      </h3>
                    </div>
                    <p className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      {previewData.activityStats.activeCustomers}
                    </p>
                  </div>
                </div>

                {/* Sample Customers */}
                <div className="bg-white/80 backdrop-blur-md rounded-2xl border-2 border-indigo-100 p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">
                    Sample Customers
                  </h3>
                  <div className="space-y-4">
                    {previewData.sampleCustomers.map((customer, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-100 hover:shadow-md transition-all duration-300"
                      >
                        <div>
                          <p className="text-lg font-semibold text-gray-900">
                            {customer.name}
                          </p>
                          <p className="text-indigo-600">{customer.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-700">
                            Orders:{" "}
                            <span className="font-semibold">
                              {customer.stats.order_count}
                            </span>
                          </p>
                          <p className="text-gray-700">
                            Spent:{" "}
                            <span className="font-semibold">
                              ₹{customer.stats.total_spent}
                            </span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Demographics Section */}
                <div className="bg-white/80 backdrop-blur-md rounded-2xl border-2 border-indigo-100 p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">
                    Demographics
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Gender Distribution */}
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border-2 border-indigo-100">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">
                        Gender
                      </h4>
                      <div className="space-y-3">
                        {previewData.demographics.gender.map((item) => (
                          <div
                            key={item.gender}
                            className="flex justify-between items-center"
                          >
                            <span className="text-gray-700">{item.gender}</span>
                            <span className="font-semibold text-indigo-600">
                              {(
                                (item.count / previewData.totalCount) *
                                100
                              ).toFixed(1)}
                              %
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Age Groups */}
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border-2 border-indigo-100">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">
                        Age Groups
                      </h4>
                      <div className="space-y-3">
                        {previewData.demographics.ageGroups.map((item) => (
                          <div
                            key={item.ageGroup}
                            className="flex justify-between items-center"
                          >
                            <span className="text-gray-700">
                              {item.ageGroup}
                            </span>
                            <span className="font-semibold text-indigo-600">
                              {(
                                (item.count / previewData.totalCount) *
                                100
                              ).toFixed(1)}
                              %
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Activity Overview */}
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border-2 border-indigo-100">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">
                        Activity Overview
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">
                            Active Customers
                          </span>
                          <span className="font-semibold text-indigo-600">
                            {(
                              (previewData.activityStats.activeCustomers /
                                previewData.totalCount) *
                              100
                            ).toFixed(1)}
                            %
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">Average Orders</span>
                          <span className="font-semibold text-indigo-600">
                            {previewData.activityStats.avgOrders.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
        </Modal>
      </div>
    </div>
  );
};

export default CampaignCreatePage;
